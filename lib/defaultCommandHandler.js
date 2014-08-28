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
    this.aggregate = aggregate;
  },

  /**
   * Injects the needed eventStore.
   * @param {Object} eventStore The eventStore object to inject.
   */
  useEventStore: function (eventStore) {
    this.eventStore = eventStore;
  },

  /**
   * Injects the needed aggregateLock.
   * @param {Object} aggregateLock The aggregateLock object to inject.
   */
  useAggregateLock: function (aggregateLock) {
    this.aggregateLock = aggregateLock;
  },

  /**
   * Queues the passed command and its callback.
   * @param {Object}   cmd The command to be queued.
   * @param {Function} clb The callback of this command.
   */
  queueCommand: function (cmd, clb) {
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
    var aggregateId = dotty.get(previousCmd, this.definitions.command.aggregateId);
    if (this.queue[aggregateId].length > 0) {
      var nextCmd = this.queue[aggregateId].shift();
      return nextCmd;
    }

    return null;
  },

  /**
   * Dequeues the passed command
   * @param {Object} cmd The command to be dequeued.
   */
  dequeueCommand: function (cmd) {
    var aggregateId = dotty.get(cmd, this.definitions.command.aggregateId);
    
    this.queue[aggregateId] = _.reject(this.queue[aggregateId], function(c) {
      return c.command === cmd;
    });
  },

  /**
   * Locks the aggregate.
   * @param {String}   aggregateId The passed aggregateId.
   * @param {Function} callback    The function, that will be called when this action is completed.
   *                               `function(err){}`
   */
  lockAggregate: function (aggregateId, callback) {
    this.aggregateLock.reserve(this.id, aggregateId, callback);
  },

  /**
   * Loads the aggregate.
   * @param {String}   aggregateId The passed aggregateId.
   * @param {Function} callback    The function, that will be called when this action is completed.
   *                               `function(err, aggregate, stream, isNewSnapshotNeeded){}`
   */
  loadAggregate: function (aggregateId, callback) {
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
    var hasAggregateName = !!this.definitions.command.aggregate;
    var hasContextName = !!this.definitions.command.context;

    var query = {
      aggregateId: aggregateId
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
  validateComand: function (cmd) {
    return this.aggregate.validateCommand(cmd);
  },

  /**
   * Returns an error if verification fails.
   * @param {AggregateModel} aggregate The passed aggregate.
   * @param {Object}         cmd       The command.
   * @returns {Error}
   */
  verifyAggregate: function (aggregate, cmd) {
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
    this.aggregate.handle(aggregate, cmd, callback);
  },
  
  /**
   * Checks if the aggregate lock is ok.
   * @param {String}   aggregateId The passed aggregateId.
   * @param {Function} callback    The function, that will be called when this action is completed.
   *                               `function(err){}`
   */
  checkAggregateLock: function (aggregateId, callback) {
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
    var self = this;
    var aggregateId = dotty.get(cmd, this.definitions.command.aggregateId);

    async.waterfall([
      
      // validate command
      function (clb) {
        debug('validate command');
        var err = self.validateComand(cmd);
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
    var self = this;
    
    function _handle () {
      self.queueCommand(cmd, callback);

      (function handleNext(nextCommand) {
        var cmdEntry = self.getNextCommandInQueue(nextCommand);
        if (cmdEntry) {
          self.workflow(cmdEntry.command, function (err, evts) {
            self.dequeueCommand(cmdEntry.command);
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
