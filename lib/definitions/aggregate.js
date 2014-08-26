'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:aggregate'),
  AggregateModel = require('../aggregateModel'),
  dotty = require('dotty'),
  DefaultCommandHandler = require('../defaultCommandHandler');

function Aggregate (meta) {  
  Definition.call(this, meta);
  
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

  this.snapshotConversions = {};
}

util.inherits(Aggregate, Definition);

function applyHelper (aggregate, aggregateModel) {
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

    aggregateModel.addUncommittedEvent(evt);
  }
}

_.extend(Aggregate.prototype, {

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
  },

  addCommandHandler: function (commandHandler) {
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
    aggregateModel.apply = applyHelper(this, aggregateModel);
    
    command.handle(cmd, aggregateModel);
    
    // remove apply function
    delete aggregateModel.apply;
    
    // TODO and now check business rules!!!
    // continue here !!!!!!!!!!!!
    // previousAttributes, aggregateModel.getUncommittedEvents()
    
    
    
    callback();
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
    this.snapshotConversions[meta.version] = fn;
    return this;
  }

});

module.exports = Aggregate;
