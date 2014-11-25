'use strict';

var debug = require('debug')('domain'),
  async = require('async'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  _ = require('lodash'),
  eventstore = require('eventstore'),
  aggregatelock = require('./lock'),
  structureLoader = require('./structure/structureLoader'),
  attachLookupFunctions = require('./structure/treeExtender'),
  ValidationError = require('./errors/validationError'),
  BusinessRuleError = require('./errors/businessRuleError'),
  AggregateConcurrencyError = require('./errors/aggregateConcurrencyError'),
  AggregateDestroyedError = require('./errors/aggregateDestroyedError'),
  CommandDispatcher = require('./commandDispatcher'),
  uuid = require('node-uuid').v4,
  dotty = require('dotty');

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
  
  this.eventStore = eventstore(options.eventStore);
  
  this.aggregateLock = aggregatelock.create(options.aggregateLock);
  
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
      err instanceof AggregateDestroyedError || err instanceof AggregateConcurrencyError) {
      dotty.put(evt, this.definitions.event.payload, {
        command: cmd,
        reason: {
          name: err.name,
          message: err.message,
          more: err.more
        }
      });
    } else if (err instanceof Error) {
//      dotty.put(evt, this.definitions.event.payload, {
//        command: cmd,
//        reason: {
//          name: err.name,
//          message: err.message
//        }
//      });
      evt = null;
    } else {
//      dotty.put(evt, this.definitions.event.payload, {
//        command: cmd,
//        reason: err
//      });
      evt = null;
    }

    return evt;
  },

  /**
   * Call this function to initialize the domain.
   * @param {Function} callback the function that will be called when this action has finished [optional]
   *                            `function(err){}`
   */
  init: function (callback) {

    var self = this;
    
    async.series([
      // load domain files...
      function (callback) {
        debug('load domain files..');
        structureLoader(self.options.domainPath, function (err, tree) {
          if (err) {
            return callback(err);
          }
          self.tree = attachLookupFunctions(tree);
          self.tv4 = tree.tv4Instance;
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
          }
        ], callback);
      },

      // inject all needed dependencies...
      function (callback) {
        debug('inject all needed dependencies...');
        
        self.commandDispatcher = new CommandDispatcher(self.tree, self.definitions.command);
        self.tree.defineOptions({ retryOnConcurrencyTimeout: self.options.retryOnConcurrencyTimeout })
                 .defineCommand(self.definitions.command)
                 .defineEvent(self.definitions.event)
                 .idGenerator(self.getNewId)
                 .useEventStore(self.eventStore)
                 .useAggregateLock(self.aggregateLock);

        callback(null);
      }
    ], function (err) {
      if (err) {
        debug(err);
      }
      if (callback) callback(err);
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
      self.commandDispatcher.dispatch(cmd, function (err, eventsToDispatch, aggregateData, meta) {
        if (err) {
          debug(err);
          var cmdRejEvt = self.createCommandRejectedEvent(cmd, err);
          if (cmdRejEvt) {
            self.onEventHandle(cmdRejEvt, function (err) { if (err) { debug(err); } });
            
            if (callback) callback(err, [cmdRejEvt], aggregateData, meta);
            return;
          }
          
          if (callback) callback(err, null, aggregateData, meta);
          return;
        }

        var evts = [];
        if (!eventsToDispatch || !_.isArray(eventsToDispatch)) {
          debug('seams to be something from a custom command handler');
          if (callback) {
            callback.apply(callback, _.toArray(arguments));
          }
          return;
        }
        
        async.each(eventsToDispatch, function (evt, callback) {
          function setEventToDispatched (e, clb) {
            if (!evt.payload || !evt.id) {
              evts.push(e);
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
            callback(err, evts, aggregateData, meta);
          }
        });
      });
    });
  }

});

module.exports = Domain;
