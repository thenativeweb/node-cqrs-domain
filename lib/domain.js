'use strict';

var debug = require('debug')('domain'),
  async = require('async'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  _ = require('lodash'),
  eventstore = require('eventstore'),
  aggregatelock = require('./aggregatelock'),
  structureLoader = require('./structureLoader'),
  attachLookupFunctions = require('./treeExtender');

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
      aggregateId: 'aggregate.id'
//      context: 'context.name',        // optional
//      aggregate: 'aggregate.name',    // optional
//      payload: 'payload',             // optional
//      revision: 'revision',           // optional
//      version: 'version',             // optional
//      meta: 'meta'                    // optional (will be passed directly from corresponding command)
    }
  };
}

util.inherits(Domain, EventEmitter);

_.extend(Domain.prototype, {

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
        self.tree.defineCommand(self.definitions.command);
        self.tree.defineEvent(self.definitions.event);
        
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
      self.commandDispatcher.dispatch(cmd, callback || function () {});
    });
  }

});

module.exports = Domain;
