'use strict';

var debug = require('debug')('domain'),
  async = require('async'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  _ = require('lodash'),
  eventstore = require('eventstore'),
  aggregatelock = require('./aggregatelock'),
  structureLoader = require('./structure/structureLoader'),
  attachLookupFunctions = require('./structure/treeExtender'),
  ValidationError = require('./errors/validationError'),
  BusinessRuleError = require('./errors/businessRuleError'),
  AggregateConcurrencyError = require('./errors/aggregateConcurrencyError'),
  AggregateDestroyedError = require('./errors/aggregateDestroyedError'),
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
}

util.inherits(Domain, EventEmitter);

_.extend(Domain.prototype, {

  createCommandRejectedEvent: function (cmd, err) {
    var evt = {};

    dotty.put(evt, this.definitions.event.correlationId, dotty.get(cmd, this.definitions.command.id));
    dotty.put(evt, this.definitions.event.name, this.options.commandRejectedEventName);
    dotty.put(evt, this.definitions.event.id, dotty.get(cmd, this.definitions.command.id) + '_reject');
    dotty.put(evt, this.definitions.event.aggregateId, dotty.get(cmd, this.definitions.command.aggregateId));
    
    if (!!this.definitions.command.meta && !!this.definitions.event.meta) {
      dotty.put(evt, this.definitions.event.meta, dotty.get(cmd, this.definitions.command.meta));
    }

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
      dotty.put(evt, this.definitions.event.payload, {
        command: cmd,
        reason: {
          name: err.name,
          message: err.message
        }
      });
    } else {
      dotty.put(evt, this.definitions.event.payload, {
        command: cmd,
        reason: err
      });
    }
  
    return evt;
  },

  /**
   * Inject definition for command structure.
   * @param   {Object} definition the definition to be injected
   * @returns {Domain}            to be able to chain...
   */
  defineCommand: function (definition) {
    this.definitions.command = _.defaults(definition, this.definitions.command);
    return this;
  },

  /**
   * Inject definition for event structure.
   * @param   {Object} definition the definition to be injected
   * @returns {Domain}            to be able to chain...
   */
  defineEvent: function (definition) {
    this.definitions.event = _.defaults(definition, this.definitions.event);
    return this;
  },
  
  /**
   * Inject function for for event notification.
   * @param   {Function} fn the function to be injected
   * @returns {Domain}      to be able to chain...
   */
  onEvent: function (fn) {
    if (fn.length === 0) {
      fn = _.wrap(fn, function(func, callback) {
        callback(null, func());
      });
    }

    this.onEventHandle = fn;

    return this;
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
        structureLoader(options.domainPath, function (err, tree) {
          if (err) {
            return callback(err);
          }
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
            
            self.eventStore.connect(callback);
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
   *                            `function(err, evts){}` evts is of type Array.
   */
  handle: function (cmd, callback) {
    var self = this;
    process.nextTick(function () {
      self.commandDispatcher.dispatch(cmd, function (err, eventsToDispatch) {
        if (err) {
          debug(err);
          self.onEventHandle(self.createCommandRejectedEvent(cmd, err), function (clb) { clb(null); });
          if (callback) callback(err);
          return;
        }

        var evts = [];
        async.each(eventsToDispatch, function (evt, callback) {
          function setEventToDispatched (clb) {
            debug('set event to dispatched');
            self.eventStore.setEventToDispatched(evt, function (err) {
              if (err) {
                return callback(err);
              }
              evts.push(evt.payload);
              clb(null);
            });
          }
          
          if (self.onEventHandle) {
            debug('publish an event');
            self.onEventHandle(evt.payload, function (clb) {
              setEventToDispatched(evt, function (err) {
                if (err) {
                  return callback(err);
                }
                clb(null);
                callback(null);
              });
            });
          } else {
            setEventToDispatched(evt, callback);
          }
        }, function (err) {
          if (err) {
            debug(err);
          }
          
          if (callback) {
            callback(err, evts);
          }
        });
      });
    });
  }

});

module.exports = Domain;
