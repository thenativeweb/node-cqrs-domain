'use strict';

var Definition = require('./definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:defaultCommandHandler'),
  dotty = require('dotty'),
  async = require('async'),
  uuid = require('node-uuid').v4,
  AggregateDestroyedError = require('./errors/aggregateDestroyedError'),
  AggregateConcurrencyError = require('./errors/aggregateConcurrencyError');

/**
 * Returns a random number between passed values of min and max.
 * @param {Number} min The minimum value of the resulting random number.
 * @param {Number} max The maximum value of the resulting random number.
 * @returns {Number}
 */
function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

/**
 * DefaultCommandHandler constructor
 * @param {Object}   meta  Meta infos like: { name: 'name', version: 1 }
 * @constructor
 */
function DefaultCommandHandler (meta) {
  Definition.call(this, meta);
  
  this.id = uuid().toString();
  this.queue = {};
}

util.inherits(DefaultCommandHandler, Definition);

_.extend(DefaultCommandHandler.prototype, {

  /**
   * Injects the needed aggregate.
   * @param {Aggregate} aggregate The aggregate object to inject.
   */
  useAggregate: function (aggregate) {
    if (!aggregate || !_.isObject(aggregate)) {
      var err = new Error('Please pass a valid aggregate!');
      debug(err);
      throw err;
    }
    this.aggregate = aggregate;
  },

  /**
   * Injects the needed eventStore.
   * @param {Object} eventStore The eventStore object to inject.
   */
  useEventStore: function (eventStore) {
    if (!eventStore || !_.isObject(eventStore)) {
      var err = new Error('Please pass a valid eventStore!');
      debug(err);
      throw err;
    }
    this.eventStore = eventStore;
  },

  /**
   * Injects the needed aggregateLock.
   * @param {Object} aggregateLock The aggregateLock object to inject.
   */
  useAggregateLock: function (aggregateLock) {
    if (!aggregateLock || !_.isObject(aggregateLock)) {
      var err = new Error('Please pass a valid aggregateLock!');
      debug(err);
      throw err;
    }
    this.aggregateLock = aggregateLock;
  },

  /**
   * Queues the passed command and its callback.
   * @param {Object}   cmd The command to be queued.
   * @param {Function} clb The callback of this command.
   */
  queueCommand: function (cmd, clb) {
    if (!cmd || !_.isObject(cmd)) {
      var err = new Error('Please pass a valid command!');
      debug(err);
      throw err;
    }
    if (!clb || !_.isFunction(clb)) {
      var err = new Error('Please pass a valid callback!');
      debug(err);
      throw err;
    }
    
    var aggregateId = dotty.get(cmd, this.definitions.command.aggregateId);
    
    this.queue[aggregateId] = this.queue[aggregateId] || [];
    this.queue[aggregateId].push({ command: cmd, callback: clb })
  },

  /**
   * Returns next command in the queue
   * @param {Object} previousCmd The previous command.
   * @returns {Object}
   */
  getNextCommandInQueue: function (previousCmd) {
    if (!previousCmd || !_.isObject(previousCmd)) {
      var err = new Error('Please pass a valid command!');
      debug(err);
      throw err;
    }
    var aggregateId = dotty.get(previousCmd, this.definitions.command.aggregateId);
    if (this.queue[aggregateId].length > 0) {
      var nextCmd = this.queue[aggregateId].shift();
      return nextCmd;
    }

    return null;
  },

  /**
   * Locks the aggregate.
   * @param {String}   aggregateId The passed aggregateId.
   * @param {Function} callback    The function, that will be called when this action is completed.
   *                               `function(err){}`
   */
  lockAggregate: function (aggregateId, callback) {
    if (!aggregateId || !_.isString(aggregateId)) {
      var err = new Error('Please pass a valid aggregateId!');
      debug(err);
      throw err;
    }
    if (!callback || !_.isFunction(callback)) {
      var err = new Error('Please pass a valid callback!');
      debug(err);
      throw err;
    }
    this.aggregateLock.reserve(this.id, aggregateId, callback);
  },

  /**
   * Loads the aggregate.
   * @param {String}   aggregateId The passed aggregateId.
   * @param {Function} callback    The function, that will be called when this action is completed.
   *                               `function(err, aggregate, stream, isNewSnapshotNeeded){}`
   */
  loadAggregate: function (aggregateId, callback) {
    if (!aggregateId || !_.isString(aggregateId)) {
      var err = new Error('Please pass a valid aggregateId!');
      debug(err);
      throw err;
    }
    if (!callback || !_.isFunction(callback)) {
      var err = new Error('Please pass a valid callback!');
      debug(err);
      throw err;
    }
    
    var hasAggregateName = !!this.definitions.command.aggregate;
    var hasContextName = !!this.definitions.command.context;

    var aggregate = this.aggregate.create(aggregateId);
    
    var query = {
      aggregateId: aggregateId
    };
    
    if (hasAggregateName) {
      query.aggregate = this.aggregate.name;
    }

    if (hasContextName) {
      query.context = this.aggregate.context.name;
    }
    
    var self = this;
    
    this.eventStore.getFromSnapshot(query, function(err, snapshot, stream) {
      if (err) {
        return callback(err);
      }
      
      var events = _.map(stream.events, function (streamEvent) {
        return streamEvent.payload;
      });
      
      var isNewSnapShotNeeded = self.aggregate.loadFromHistory(aggregate, snapshot, events);
      
      callback(null, aggregate, stream, isNewSnapShotNeeded);
    });
  },

  /**
   * Creates a new snapshot.
   * @param {AggregateModel} aggregate The passed aggregate.
   * @param {Object}         stream    The event stream.
   * @param {Function}       callback  The function, that will be called when this action is completed. [optional]
   *                                   `function(err){}`
   */
  createSnapshot: function (aggregate, stream, callback) {
    if (!aggregate || !_.isObject(aggregate)) {
      var err = new Error('Please pass a valid aggregate!');
      debug(err);
      throw err;
    }
    if (!stream || !_.isObject(stream)) {
      var err = new Error('Please pass a valid aggregate!');
      debug(err);
      throw err;
    }
    if (!callback || !_.isFunction(callback)) {
      var err = new Error('Please pass a valid callback!');
      debug(err);
      throw err;
    }
    
    var hasAggregateName = !!this.definitions.command.aggregate;
    var hasContextName = !!this.definitions.command.context;

    var query = {
      aggregateId: aggregate.id
    };

    if (hasAggregateName) {
      query.aggregate = this.aggregate.name;
    }

    if (hasContextName) {
      query.context = this.aggregate.context.name;
    }
    
    query.data = aggregate.toJSON();
    query.revision = stream.lastRevision;
    query.version = this.aggregate.version;

    var self = this;
    
    process.nextTick(function() {
      debug('cerate new snapshot');
      self.eventStore.createSnapshot(query, function (err) {
        if (err) {
          debug(err);
          if (callback) callback(err);
          return;
        }
        debug('snapshot created');
        if (callback) callback(null);
      });
    });
  },

  /**
   * Returns an error if the aggregate is destroyed.
   * @param {AggregateModel} aggregate The passed aggregate.
   * @returns {AggregateDestroyedError}
   */
  isAggregateDestroyed: function (aggregate) {
    if (!aggregate || !_.isObject(aggregate)) {
      var err = new Error('Please pass a valid aggregate!');
      debug(err);
      throw err;
    }
    
    if (aggregate.isDestroyed()) {
      return new AggregateDestroyedError('Aggregate has already been destroyed!', {
        aggregateId: aggregate.id,
        aggregateRevision: aggregate.getRevision()
      });
    }
    
    return null;
  },

  /**
   * Returns an error if the revision does not match.
   * @param {AggregateModel} aggregate The passed aggregate.
   * @param {Object}         cmd       The command.
   * @returns {AggregateConcurrencyError}
   */
  isRevisionWrong: function (aggregate, cmd) {
    if (!aggregate || !_.isObject(aggregate)) {
      var err = new Error('Please pass a valid aggregate!');
      debug(err);
      throw err;
    }
    if (!cmd || !_.isObject(cmd)) {
      var err = new Error('Please pass a valid command!');
      debug(err);
      throw err;
    }
    
    var hasRevision = !!this.definitions.command.revision;
    
    if (!hasRevision) {
      return null;
    }
    
    var revisionInCommand = dotty.get(cmd, this.definitions.command.revision);
    if (revisionInCommand === aggregate.getRevision()) {
      return null;
    }
    
    return new AggregateConcurrencyError('Actual revision in command is "' + revisionInCommand + '", but expected is "' + aggregate.getRevision() + '"!', {
      aggregateId: aggregate.id,
      aggregateRevision: aggregate.getRevision(),
      commandRevision: revisionInCommand
    });
  },

  /**
   * Returns an error if the command is not valid.
   * @param {Object} cmd The command.
   * @returns {ValidationError}
   */
  validateCommand: function (cmd) {
    if (!cmd || !_.isObject(cmd)) {
      var err = new Error('Please pass a valid command!');
      debug(err);
      throw err;
    }
    return this.aggregate.validateCommand(cmd);
  },

  /**
   * Returns an error if verification fails.
   * @param {AggregateModel} aggregate The passed aggregate.
   * @param {Object}         cmd       The command.
   * @returns {Error}
   */
  verifyAggregate: function (aggregate, cmd) {
    if (!aggregate || !_.isObject(aggregate)) {
      var err = new Error('Please pass a valid aggregate!');
      debug(err);
      throw err;
    }
    if (!cmd || !_.isObject(cmd)) {
      var err = new Error('Please pass a valid command!');
      debug(err);
      throw err;
    }
    
    var reason = this.isAggregateDestroyed(aggregate);
    if (reason) {
      return reason;
    }
    
    reason = this.isRevisionWrong(aggregate, cmd);
    if (reason) {
      return reason;
    }
  },

  /**
   * Handles the command by passing it to the handle function of the aggregate.
   * @param {AggregateModel} aggregate The passed aggregate.
   * @param {Object}         cmd       The command.
   * @param {Function}       callback  The function, that will be called when this action is completed.
   *                                   `function(err){}`
   */
  letHandleCommandByAggregate: function (aggregate, cmd, callback) {
    if (!aggregate || !_.isObject(aggregate)) {
      var err = new Error('Please pass a valid aggregate!');
      debug(err);
      throw err;
    }
    if (!cmd || !_.isObject(cmd)) {
      var err = new Error('Please pass a valid command!');
      debug(err);
      throw err;
    }
    if (!callback || !_.isFunction(callback)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }
    
    this.aggregate.handle(aggregate, cmd, callback);
  },
  
  /**
   * Checks if the aggregate lock is ok.
   * @param {String}   aggregateId The passed aggregateId.
   * @param {Function} callback    The function, that will be called when this action is completed.
   *                               `function(err){}`
   */
  checkAggregateLock: function (aggregateId, callback) {
    if (!aggregateId || !_.isString(aggregateId)) {
      var err = new Error('Please pass a valid aggregateId!');
      debug(err);
      throw err;
    }
    if (!callback || !_.isFunction(callback)) {
      var err = new Error('Please pass a valid callback!');
      debug(err);
      throw err;
    }
    
    var self = this;

    this.aggregateLock.getAll(aggregateId, function (err, workerIds) {
      if (err) {
        return callback(err);
      }
      
      if (workerIds.length === 1 && workerIds[0].id === self.id) {
        return callback(null);
      }
      
      var err = new Error('Concurrency exception!');
      debug(err);
      callback(err);
    });
  },

  /**
   * Resolves if the aggregate lock.
   * @param {String}   aggregateId The passed aggregateId.
   * @param {Function} callback    The function, that will be called when this action is completed.
   *                               `function(err){}`
   */
  resolveAggregateLock: function (aggregateId, callback) {
    if (!aggregateId || !_.isString(aggregateId)) {
      var err = new Error('Please pass a valid aggregateId!');
      debug(err);
      throw err;
    }
    if (!callback || !_.isFunction(callback)) {
      var err = new Error('Please pass a valid callback!');
      debug(err);
      throw err;
    }

    this.aggregateLock.resolve(aggregateId, callback);
  },

  /**
   * Saves the uncommitted events of an aggregate in the eventstore.
   * @param {AggregateModel} aggregate The passed aggregate.
   * @param {Object}         stream    The event stream.
   * @param {Function}       callback  The function, that will be called when this action is completed.
   *                                   `function(err, eventsToDispatch){}`
   */
  commit: function (aggregate, stream, callback) {
    if (!aggregate || !_.isObject(aggregate)) {
      var err = new Error('Please pass a valid aggregate!');
      debug(err);
      throw err;
    }
    if (!stream || !_.isObject(stream)) {
      var err = new Error('Please pass a valid stream!');
      debug(err);
      throw err;
    }
    if (!callback || !_.isFunction(callback)) {
      var err = new Error('Please pass a valid callback!');
      debug(err);
      throw err;
    }

    var uncommitedEvents = aggregate.getUncommittedEvents();
    
    stream.addEvents(uncommitedEvents);

    stream.commit(function (err, stream) {
      if (err) {
        return callback(err);
      }
      
      callback(null, stream.eventsToDispatch);
    });
  },

  /**
   * Executes the default workflow to handle a command.
   * @param {Object}   cmd      The passed command.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, eventsToDispatch){}`
   */
  workflow: function (cmd, callback) {
    if (!cmd || !_.isObject(cmd)) {
      var err = new Error('Please pass a valid command!');
      debug(err);
      throw err;
    }
    if (!callback || !_.isFunction(callback)) {
      var err = new Error('Please pass a valid callback!');
      debug(err);
      throw err;
    }
    
    var self = this;
    var aggregateId = dotty.get(cmd, this.definitions.command.aggregateId);

    async.waterfall([
      
      // validate command
      function (clb) {
        debug('validate command');
        var err = self.validateCommand(cmd);
        clb(err);
      },
        
      // lock aggregate
      function (clb) {
        debug('lock aggregate');
        self.lockAggregate(aggregateId, clb);
      },

      // load aggregate
      function (clb) {
        debug('load aggregate');
        self.loadAggregate(aggregateId, clb);
      },
      
      // check if new snapshot is needed
      function (aggregate, stream, isNewSnapShotNeeded, clb) {
        debug('check if new snapshot is needed');
        if (isNewSnapShotNeeded) {
          self.createSnapshot(aggregate, stream);
        }
        clb(null, aggregate, stream);
      },

      // verify aggregate
      function (aggregate, stream, clb) {
        debug('verify aggregate');
        var err = self.verifyAggregate(aggregate, cmd);
        if (err) {
          return callback(err);
        }
        clb(null, aggregate, stream);
      },
      
      // handle command and check business rules
      function (aggregate, stream, clb) {
        debug('handle command');
        self.letHandleCommandByAggregate(aggregate, cmd, function (err) { // err is a business rule error
          if (err) {
            return callback(err);
          }
          clb(null, aggregate, stream);
        });
      },
      
      // check aggregate lock
      function (aggregate, stream, clb) {
        debug('check aggregate lock');
        self.checkAggregateLock(aggregateId, function (err) {
          return clb(err, aggregate, stream);
        });
      },
      
      // commit new aggregate events
      function (aggregate, stream, clb) {
        debug('commit new aggregate events');
        self.commit(aggregate, stream, clb);
      }

    ], function (err, eventsToDispatch) {
      // unlock...
      debug('unlock aggregate');
      
      self.resolveAggregateLock(aggregateId, function (errLock) {
        if (errLock) {
          debug(errLock);
          return callback(errLock);
        }

        if (err) {
          debug(err);

          if (err.message.match(/Concurrency/i)) {
            var retryIn = randomBetween(0, self.options.retryOnConcurrencyTimeout); // could be overwritten in a custom commandHandler?
            debug('retry in ' + retryIn + 'ms');
            setTimeout(function() {
              self.workflow(cmd, callback);
            }, retryIn);
            return;
          }
          
          return callback(err);
        }

        callback(null, eventsToDispatch);
      });
    });
  },

  /**
   * Handles the passed command
   * @param {Object}   cmd      The passed command
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, evts){}`
   */
  handle: function (cmd, callback) {
    if (!cmd || !_.isObject(cmd)) {
      var err = new Error('Please pass a valid command!');
      debug(err);
      throw err;
    }
    if (!callback || !_.isFunction(callback)) {
      var err = new Error('Please pass a valid callback!');
      debug(err);
      throw err;
    }
    
    var self = this;
    
    function _handle () {
      self.queueCommand(cmd, callback);

      (function handleNext(nextCommand) {
        var cmdEntry = self.getNextCommandInQueue(nextCommand);
        if (cmdEntry) {
          self.workflow(cmdEntry.command, function (err, evts) {
            handleNext(cmdEntry.command);
            cmdEntry.callback(err, evts);
          });
        }
      })(cmd);
    }
    
    if (dotty.exists(cmd, this.definitions.command.aggregateId)) {
      return _handle();
    }
    
    debug('no aggregateId in command, so generate a new one');
    
    this.eventStore.getNewId(function (err, id) {
      if (err) {
        debug(err);
        return callback(err);
      }
      
      dotty.put(cmd, self.definitions.command.aggregateId, id);
      return _handle();
    });
  }
  
});

module.exports = DefaultCommandHandler;
