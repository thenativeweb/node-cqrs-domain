'use strict';

var debug = require('debug')('domain'),
  async = require('async'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  _ = require('lodash'),
  eventstore = require('eventstore'),
  aggregatelock = require('./lock'),
  commandBumper = require('./bumper'),
  structureLoader = require('./structure/structureLoader'),
  attachLookupFunctions = require('./structure/treeExtender'),
  ValidationError = require('./errors/validationError'),
  BusinessRuleError = require('./errors/businessRuleError'),
  AggregateConcurrencyError = require('./errors/aggregateConcurrencyError'),
  AggregateDestroyedError = require('./errors/aggregateDestroyedError'),
  DuplicateCommandError = require('./errors/duplicateCommandError'),
  CommandDispatcher = require('./commandDispatcher'),
  uuid = require('uuid').v4,
  dotty = require('dotty');

function isValidEventStore (obj) {
  // TODO: check each method's signature?
  return !!obj && _.every([
    obj.init, obj.on, obj.getNewId, obj.getFromSnapshot,
    obj.createSnapshot, obj.setEventToDispatched],
    function (o) {
      return _.isFunction(o);
    }
  );
}

function createEventStore (options) {
  if ( _.isFunction(options)) {
    // This is a factory method.
    var eventStore = options();
    if (!isValidEventStore(eventStore)) {
      var err = new Error('"options.eventStore" is not a valid event store factory');
      debug(err);
      throw err;
    }
    return eventStore;
  }
  return eventstore(options);
}

function isValidAggregateLock (obj) {
  // TODO: check each method's signature?
  return !!obj && _.every([
    obj.connect, obj.disconnect, obj.on, obj.getNewId,
    obj.reserve, obj.getAll, obj.resolve],
    function (o) {
      return _.isFunction(o);
    }
  );
}

function isValidCommandBumper (obj) {
  // TODO: check each method's signature?
  return !!obj && _.every([
        obj.connect, obj.disconnect, obj.on, obj.getNewId,
        obj.add],
      function (o) {
        return _.isFunction(o);
      }
    );
}

function createAggregateLock (options) {
  if (_.isFunction(options)) {
    // This is a factory method.
    var lock = options();
    if (!isValidAggregateLock(lock)) {
      var err = new Error('"options.aggregateLock" is not a valid aggregate lock factory');
      debug(err);
      throw err;
    }
  }
  return aggregatelock.create(options);
}

function createCommandBumper (options) {
  if (_.isFunction(options)) {
    // This is a factory method.
    var bumper = options();
    if (!isValidCommandBumper(bumper)) {
      var err = new Error('"options.deduplication" is not a valid deduplication store factory');
      debug(err);
      throw err;
    }
  }
  return commandBumper.create(options);
}

/**
 * Domain constructor
 * @param {Object} options The options.
 * @constructor
 */
function Domain(options) {
  EventEmitter.call(this);

  options = options || {};

  if (!options.domainPath) {
    var err = new Error('Please provide domainPath in options');
    debug(err);
    throw err;
  }

  options.retryOnConcurrencyTimeout = options.retryOnConcurrencyTimeout || 800;

  options.commandRejectedEventName = options.commandRejectedEventName || 'commandRejected';

  options.snapshotThreshold = options.snapshotThreshold || 100;

  options.useLoaderExtensions = options.useLoaderExtensions || false

  this.eventStore = createEventStore(options.eventStore);

  this.aggregateLock = createAggregateLock(options.aggregateLock);

  if (options.deduplication) {
    this.commandBumper = createCommandBumper(options.deduplication);
  }

  this.options = options;

  this.definitions = {
    command: {
      id: 'id',
      name: 'name',
      aggregateId: 'aggregate.id'
//      context: 'context.name',        // optional
//      aggregate: 'aggregate.name',    // optional
//      payload: 'payload',             // optional
//      revision: 'revision',           // optional
//      version: 'version',             // optional
//      meta: 'meta'                    // optional (will be passed directly to corresponding event(s))
    },
    event: {
      correlationId: 'correlationId',
      id: 'id',
      name: 'name',
      aggregateId: 'aggregate.id',
//      context: 'context.name',        // optional
//      aggregate: 'aggregate.name',    // optional
      payload: 'payload',               // optional
      revision: 'revision'              // optional
//      version: 'version',             // optional
//      meta: 'meta'                    // optional (will be passed directly from corresponding command)
    }
  };

  this.idGenerator(function () {
    return uuid().toString();
  });

  this.onEvent(function (evt) {
    debug('emit:', evt);
  });

  this.extendValidator(function (validator) {
    debug('no validator extension defined');
  });
}

util.inherits(Domain, EventEmitter);

_.extend(Domain.prototype, {

  /**
   * Inject definition for command structure.
   * @param   {Object} definition the definition to be injected
   * @returns {Domain}            to be able to chain...
   */
  defineCommand: function (definition) {
    if (!definition || !_.isObject(definition)) {
      var err = new Error('Please pass a valid definition!');
      debug(err);
      throw err;
    }

    this.definitions.command = _.defaults(definition, this.definitions.command);
    return this;
  },

  /**
   * Inject definition for event structure.
   * @param   {Object} definition the definition to be injected
   * @returns {Domain}            to be able to chain...
   */
  defineEvent: function (definition) {
    if (!definition || !_.isObject(definition)) {
      var err = new Error('Please pass a valid definition!');
      debug(err);
      throw err;
    }

    this.definitions.event = _.defaults(definition, this.definitions.event);

    if (this.definitions.event.commitStamp) {
      this.eventStore.defineEventMappings({
        commitStamp: this.definitions.event.commitStamp
      });
    }
    return this;
  },

  /**
   * Inject idGenerator function.
   * @param   {Function}  fn The function to be injected.
   * @returns {Domain}       to be able to chain...
   */
  idGenerator: function (fn) {
    if (!fn || !_.isFunction(fn)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    if (fn.length === 1) {
      this.getNewId = fn;
      return this;
    }

    this.getNewId = function (callback) {
      callback(null, fn());
    };

    return this;
  },

  /**
   * Inject idGenerator function for aggregate id.
   * @param   {Function}  fn The function to be injected.
   * @returns {Domain}       to be able to chain...
   */
  aggregateIdGenerator: function (fn) {
    if (!fn || !_.isFunction(fn)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    if (fn.length === 1) {
      this.getNewAggregateId = fn;
      return this;
    }

    this.getNewAggregateId = function (callback) {
      callback(null, fn());
    };

    return this;
  },

  /**
   * Inject function for for event notification.
   * @param   {Function} fn the function to be injected
   * @returns {Domain}      to be able to chain...
   */
  onEvent: function (fn) {
    if (!fn || !_.isFunction(fn)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    if (fn.length === 1) {
      fn = _.wrap(fn, function(func, evt, callback) {
        func(evt);
        callback(null);
      });
    }

    this.onEventHandle = fn;

    return this;
  },

  /**
   * Converts an error to the commandRejected event
   * @param {Object} cmd The command that was handled.
   * @param {Error}  err The error that occurs.
   * @returns {Object} The resulting event.
   */
  createCommandRejectedEvent: function (cmd, err) {
    if (!cmd || !_.isObject(cmd)) {
      var err = new Error('Please pass a valid command!');
      debug(err);
      throw err;
    }
    if (!err || !_.isObject(err)) {
      var err = new Error('Please pass a valid error!');
      debug(err);
      throw err;
    }

    var evt = {};

    if (!!this.definitions.command.meta && !!this.definitions.event.meta) {
      dotty.put(evt, this.definitions.event.meta, dotty.get(cmd, this.definitions.command.meta));
    }

    dotty.put(evt, this.definitions.event.correlationId, dotty.get(cmd, this.definitions.command.id));
    dotty.put(evt, this.definitions.event.name, this.options.commandRejectedEventName);
    dotty.put(evt, this.definitions.event.id, dotty.get(cmd, this.definitions.command.id) + '_rejected');
    dotty.put(evt, this.definitions.event.aggregateId, dotty.get(cmd, this.definitions.command.aggregateId));

    if (!!this.definitions.command.aggregate && !!this.definitions.event.aggregate) {
      dotty.put(evt, this.definitions.event.aggregate, dotty.get(cmd, this.definitions.command.aggregate));
    }

    if (!!this.definitions.command.context && !!this.definitions.event.context) {
      dotty.put(evt, this.definitions.event.context, dotty.get(cmd, this.definitions.command.context));
    }

    if (err instanceof ValidationError || err instanceof BusinessRuleError ||
        err instanceof AggregateDestroyedError || err instanceof AggregateConcurrencyError ||
        err instanceof DuplicateCommandError) {
      dotty.put(evt, this.definitions.event.payload, {
        command: cmd,
        reason: {
          name: err.name,
          message: err.message,
          more: err.more
        }
      });
    } else {
      evt = null;
    }

    return evt;
  },

  /**
   * Returns the domain information.
   * @returns {Object}
   */
  getInfo: function () {
    if (!this.tree) {
      var err = new Error('Not initialized!');
      debug(err);
      throw err;
    }

    return this.tree.getInfo();
  },

  /**
   * Extends the validator instance.
   * @param   {Function} fn the function to be injected
   * @returns {Domain}      to be able to chain...
   */
  extendValidator: function (fn) {
    if (!fn || !_.isFunction(fn) || fn.length !== 1) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    this.validatorExtension = fn;

    return this;
  },

  /**
   * Call this function to initialize the domain.
   * @param {Function} callback the function that will be called when this action has finished [optional]
   *                            `function(err, warnings){}`
   */
  init: function (callback) {

    var self = this;

    var warnings = null;

    async.series([
      // load domain files...
      function (callback) {
        debug('load domain files..');
        structureLoader(self.options.domainPath, self.validatorExtension, self.options.useLoaderExtensions, function (err, tree, warns) {
          if (err) {
            return callback(err);
          }
          warnings = warns;

          if (!tree || _.isEmpty(tree)) return callback(new Error('No structure loaded for ' + self.options.domainPath + '!'));

          self.tree = attachLookupFunctions(tree);
          callback(null);
        });
      },

      // prepare infrastructure...
      function (callback) {
        debug('prepare infrastructure...');
        async.parallel([

          // prepare eventStore...
          function (callback) {
            debug('prepare eventStore...');

            self.eventStore.on('connect', function () {
              self.emit('connect');
            });

            self.eventStore.on('disconnect', function () {
              self.emit('disconnect');
            });

            self.eventStore.init(callback);
          },

          // prepare aggregateLock...
          function (callback) {
            debug('prepare aggregateLock...');

            self.aggregateLock.on('connect', function () {
              self.emit('connect');
            });

            self.aggregateLock.on('disconnect', function () {
              self.emit('disconnect');
            });

            self.aggregateLock.connect(callback);
          },

          // prepare commandBumper...
          function (callback) {
            if (!self.commandBumper) {
              return callback(null);
            }
            debug('prepare commandBumper...');

            self.commandBumper.on('connect', function () {
              self.emit('connect');
            });

            self.commandBumper.on('disconnect', function () {
              self.emit('disconnect');
            });

            self.commandBumper.connect(callback);
          }
        ], callback);
      },

      // inject all needed dependencies...
      function (callback) {
        debug('inject all needed dependencies...');

        self.commandDispatcher = new CommandDispatcher(self.tree, self.definitions.command, self.commandBumper);
        self.tree.defineOptions({
            retryOnConcurrencyTimeout: self.options.retryOnConcurrencyTimeout,
            snapshotThreshold: self.options.snapshotThreshold,
            snapshotThresholdMs: self.options.snapshotThresholdMs
          })
          .defineCommand(self.definitions.command)
          .defineEvent(self.definitions.event)
          .idGenerator(self.getNewId)
          .useEventStore(self.eventStore)
          .useAggregateLock(self.aggregateLock);

        if (self.getNewAggregateId) {
          self.tree.aggregateIdGenerator(self.getNewAggregateId);
        }

        callback(null);
      }
    ], function (err) {
      if (err) {
        debug(err);
      } else {
        debug('domain inited');
      }
      if (callback) callback(err, warnings);
    });
  },

  /**
   * Is called when dispatched a command.
   * @param {Object}   cmd              the command object
   * @param {Error}    err              the error
   * @param {Array}    eventsToDispatch the events to dispatch
   * @param {Object}   aggregateData    the aggregate data
   * @param {Object}   meta             the meta infos
   * @param {Function} callback         the function that will be called when this action has finished [optional]
   *                                    `function(err, evts, aggregateData, meta){}` evts is of type Array, aggregateData and meta are an object
   */
  onDispatched: function (cmd, err, eventsToDispatch, aggregateData, meta, callback) {
    var self = this;

    if (err) {
      debug(err);
      var cmdRejEvt = this.createCommandRejectedEvent(cmd, err);
      if (cmdRejEvt) {
        this.onEventHandle(cmdRejEvt, function (err) { if (err) { debug(err); } });

        if (callback) {
          try {
            callback(err, [cmdRejEvt], aggregateData || null, meta || null);
          } catch (e) {
            debug(e);
            console.log(e.stack);
            process.emit('uncaughtException', e);
          }
        }
        return;
      }

      if (callback) {
        try {
          callback(err, null, aggregateData, meta);
        } catch (e) {
          debug(e);
          console.log(e.stack);
          process.emit('uncaughtException', e);
        }
      }
      return;
    }

    var evts = [];
    if (!eventsToDispatch || !_.isArray(eventsToDispatch)) {
      debug('seams to be something from a custom command handler');
      if (callback) {
        try {
          callback.apply(callback, _.toArray(arguments));
        } catch (e) {
          debug(e);
          console.log(e.stack);
          process.emit('uncaughtException', e);
        }
      }
      return;
    }

    async.each(eventsToDispatch, function (evt, callback) {
      function setEventToDispatched (e, clb) {
        if (!e.payload || !e.id || e.disablePersistence) {
          evts.push(e.payload || e);
          return callback(null);
        }
        debug('set event to dispatched');
        self.eventStore.setEventToDispatched(e, function (err) {
          if (err) {
            return callback(err);
          }
          evts.push(e.payload);
          clb(null);
        });
      }

      if (self.onEventHandle) {
        debug('publish an event');
        if (evt.payload && evt.id) {
          self.onEventHandle(evt.payload, function (err) {
            if (err) {
              debug(err);
              return callback(err);
            }
            setEventToDispatched(evt, function (err) {
              if (err) {
                return callback(err);
              }
              callback(null);
            });
          });
        } else {
          // seams that custom command handler has done some strange stuff!!!
          self.onEventHandle(evt, function (err) {
            if (err) {
              debug(err);
              return callback(err);
            }
            evts.push(evt);
            callback(null);
          });
        }
      } else {
        setEventToDispatched(evt, callback);
      }
    }, function (err) {
      if (err) {
        debug(err);
      }

      if (callback) {
        try {
          callback(err, evts, aggregateData, meta);
        } catch (e) {
          debug(e);
          console.log(e.stack);
          process.emit('uncaughtException', e);
        }
      }
    });
  },

  /**
   * Call this function to let the domain handle it.
   * @param {Object}   cmd      the command object
   * @param {Function} callback the function that will be called when this action has finished [optional]
   *                            `function(err, evts, aggregateData, meta){}` evts is of type Array, aggregateData and meta are an object
   */
  handle: function (cmd, callback) {
    if (!cmd || !_.isObject(cmd) || !dotty.exists(cmd, this.definitions.command.name)) {
      var err = new Error('Please pass a valid command!');
      debug(err);
      if (callback) callback(err);
      return;
    }

    var self = this;
    process.nextTick(function () {
      if (callback && callback.length > 2) {
        self.commandDispatcher.dispatch(cmd, function (err, eventsToDispatch, aggregateData, meta) {
          self.onDispatched(cmd, err, eventsToDispatch, aggregateData, meta, callback);
        });
        return;
      }
      self.commandDispatcher.dispatch(cmd, function (err, eventsToDispatch) {
        self.onDispatched(cmd, err, eventsToDispatch, null, null, callback);
      });
    });
  }

});

module.exports = Domain;
