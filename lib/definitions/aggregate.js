'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:aggregate'),
  AggregateModel = require('../aggregateModel'),
  dotty = require('dotty'),
  DefaultCommandHandler = require('../defaultCommandHandler'),
  uuid = require('node-uuid').v4,
  async = require('async');

function Aggregate (meta) {  
  Definition.call(this, meta);

  meta = meta || {};
  
  this.version = meta.version || 0;
  
  if (meta.snapshotThreshold && !_.isFunction(meta.snapshotThreshold)) {
    meta.snapshotThreshold = function () { return meta.snapshotThreshold; };
  }
  
  this.snapshotThreshold = meta.snapshotThreshold || function () { return 100; };
  
  this.commands = [];
  this.events = [];
  this.businessRules = [];
  this.commandHandlers = [];
  
  this.defaultCommandHandler = new DefaultCommandHandler(this);
  this.defaultCommandHandler.useAggregate(this);

  this.snapshotConversions = {};
  
  this.idGenerator(function () {
    return uuid().toString();
  });
}

util.inherits(Aggregate, Definition);

function applyHelper (aggregate, aggregateModel, cmd) {
  return function (name, payload) {
    var evt;

    if (!payload) {
      if (_.isString(name)) {
        evt = {};
        dotty.put(evt, aggregate.definitions.event.name, name);
      } else if (_.isObject(name)) {
        evt = name;
      }
    } else {
      evt = {};
      dotty.put(evt, aggregate.definitions.event.name, name);
      dotty.put(evt, aggregate.definitions.event.payload, payload);
    }

    var revision = aggregateModel.getRevision() + 1;
    dotty.put(evt, aggregate.definitions.event.revision, revision);
    dotty.put(evt, aggregate.definitions.event.aggregateId, aggregateModel.id);
    dotty.put(evt, aggregate.definitions.event.correlationId, dotty.get(cmd, aggregate.definitions.command.id));

    if (!!aggregate.definitions.event.version) {
      dotty.put(evt, aggregate.definitions.event.version, aggregate.version);
    }
    
    if (!!aggregate.definitions.event.aggregate && !!aggregate.definitions.command.aggregate) {
      dotty.put(evt, aggregate.definitions.event.aggregate, aggregate.name);
    }

    if (!!aggregate.definitions.event.context && !!aggregate.definitions.command.context) {
      dotty.put(evt, aggregate.definitions.event.context, aggregate.context.name);
    }

    if (!!aggregate.definitions.event.meta && !!aggregate.definitions.command.meta) {
      dotty.put(evt, aggregate.definitions.event.meta, dotty.get(cmd, aggregate.definitions.command.meta));
    }

    aggregateModel.addUncommittedEvent(evt);
  }
}

_.extend(Aggregate.prototype, {

  idGenerator: function (fn) {
    if (fn.length === 0) {
      fn = _.wrap(fn, function(func, callback) {
        callback(null, func());
      });
    }

    this.getNewId = fn;

    return this;
  },

  defineContext: function (context) {
    this.context = context;
  },
  
  addCommand: function (command) {
    this.commands.push(command);
  },

  addEvent: function (event) {
    this.events.push(event);
  },

  addBusinessRule: function (businessRule) {
    this.businessRules.push(businessRule);

    this.businessRules = _.sortBy(this.businessRules, function(br) {
      return br.priority;
    });
  },

  addCommandHandler: function (commandHandler) {
    commandHandler.useAggregate(this);
    this.commandHandlers.push(commandHandler);
  },

  getCommandsByName: function (name) {
    return _.filter(this.commands, function (cmd) {
      return cmd.name === name;
    });
  },

  getCommand: function (name, version) {
    version = version || 0;
    return _.find(this.commands, function (cmd) {
      return cmd.name === name && cmd.version === version;
    });
  },

  getCommands: function () {
    return this.commands;
  },

  getEvent: function (name, version) {
    version = version || 0;
    return _.find(this.events, function (evt) {
      return evt.name === name && evt.version === version;
    });
  },

  getEvents: function () {
    return this.events;
  },

  getBusinessRules: function () {
    return this.businessRules;
  },

  getCommandHandlers: function () {
    return this.commandHandlers;
  },
  
  getCommandHandler: function (name, version) {
    version = version || 0;
    var handler =  _.find(this.commandHandlers, function (cmdHnd) {
      return cmdHnd.name === name && cmdHnd.version === version;
    });
    
    if (handler) {
      return handler;
    }
    
    return defaultCommandHandler;
  },
  
  create: function (id) {
    return new AggregateModel(id, this.name, this.version);
  },
  
  validateCommand: function (cmd) {
    var cmdName = dotty.get(cmd, this.definitions.command.name);
    var version = 0;
    if (!!this.definitions.command.version) {
      version = dotty.get(cmd, this.definitions.command.version);
    }
    
    var command = this.getCommand(cmdName, version);
    if (!command) {
      var err = new Error('Command "' + cmdName + '" not found!');
      debug(err);
      return err;
    }
    
    return command.validate(cmd);
  },
  
  checkBusinessRules: function (changed, previous, events, command, callback) {
    async.eachSeries(this.getBusinessRules(), function (rule, callback) {
      rule.check(changed, previous, events, command, callback);
    }, callback);
  },
  
  handle: function (aggregateModel, cmd, callback) {
    var cmdName = dotty.get(cmd, this.definitions.command.name);
    var version = 0;
    if (!!this.definitions.command.version) {
      version = dotty.get(cmd, this.definitions.command.version);
    }

    var command = this.getCommand(cmdName, version);
    if (!command) {
      var err = new Error('Command "' + cmdName + '" not found!');
      debug(err);
      return callback(err);
    }
    
    var previousAttributes = aggregateModel.toJSON();

    // attach apply function
    aggregateModel.apply = applyHelper(this, aggregateModel, cmd);
    
    debug('handle command');
    command.handle(cmd, aggregateModel);
    
    // remove apply function
    delete aggregateModel.apply;
    
    var self = this;
    
    function checkBusinessRules () {
      // check business rules
      debug('check business rules');
      self.checkBusinessRules(aggregateModel.toJSON(), previousAttributes, aggregateModel.getUncommittedEvents(), cmd, function (err) {
        if (!err) {
          return callback(null);
        }

        aggregateModel.set(previousAttributes);
        aggregateModel.clearUncommittedEvents();
        callback(err);
      });
    }
    
    var isEvtIdDefined = !!dotty.get(evt, aggregate.definitions.event.id);
    if (isEvtIdDefined) {
      debug('event id already defined');
      return checkBusinessRules();
    }

    // generate new id for event
    debug('generate new id for event');
    this.getNewId(function (err, id) {
      if (!err) {
        return callback(null);
      }
      
      dotty.put(evt, aggregate.definitions.event.id, id);
      checkBusinessRules();
    });
  },
  
  apply: function (aggregateModel, events) {
    if (!_.isArray(events)) {
      events = [events];
    }
    
    var self = this;
    
    events.forEach(function (evt) {
      var evtName = dotty.get(evt, self.definitions.event.name);
      var version = 0;
      if (!!self.definitions.event.version) {
        version = dotty.get(evt, self.definitions.event.version);
      }

      var event = self.getEvent(evtName, version);

      if (!event) {
        var err = new Error('Event "' + evtName + '" not found!');
        debug(err);
        throw err;
      }
      
      event.apply(evt, aggregateModel);
    });
  },

  loadFromHistory: function (aggregateModel, snapshot, events) {
    var self = this;
    
    var isSnapshotNeeded = false;
    
    if (snapshot) {
      // load snapshot
      debug('load snapshot from history');
      if (snapshot.version === this.version) {
        aggregateModel.set(snapshot.data);
      } else {
        debug('convert snapshot from history');
        this.snapshotConversions[snapshot.version](snapshot.data, aggregateModel);
        isSnapshotNeeded = true;
      }
      aggregateModel.setRevision(snapshot.revision);
    }
    
    if (events && events.length > 0) {
      // load events
      debug('load events from history');
      var maxRevision = _.reduce(events, function (res, evt) {
        var rev = dotty.get(evt, self.definitions.event.revision);
        if (rev > res) {
          return rev;
        }
        return res;
      }, 0);

      this.apply(aggregateModel, events);

      aggregateModel.setRevision(maxRevision);
      
      if (!isSnapshotNeeded) {
        isSnapshotNeeded = this.isSnapshotThresholdNeeded(events, aggregateModel);
      }
    }
    
    return isSnapshotNeeded;
  },

  isSnapshotThresholdNeeded: function (events, aggregateModel) {
    return events.length >= this.snapshotThreshold();
  },

  defineSnapshotConversion: function (meta, fn) {
    if (!_.isObject(meta) || meta.version === undefined || meta.version === null || !_.isNumber(meta.version)) {
      throw new Error('Please pass in a version');
    }
    if (!_.isFunction(fn)) {
      throw new Error('Please pass in a function');
    }
    
    this.snapshotConversions[meta.version] = fn;
    return this;
  }

});

module.exports = Aggregate;
