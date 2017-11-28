'use strict';

var Definition = require('./definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:defaultCommandHandler'),
  dotty = require('dotty'),
  async = require('async'),
  uuid = require('uuid').v4,
  ConcurrencyError = require('./errors/concurrencyError'),
  AggregateDestroyedError = require('./errors/aggregateDestroyedError'),
  AggregateConcurrencyError = require('./errors/aggregateConcurrencyError'),
  EventFromEventStore = require('eventstore/lib/event');

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
   * @param {String}   aggId The passed aggregate id.
   * @param {Object}   cmd   The command to be queued.
   * @param {Function} clb   The callback of this command.
   */
  queueCommand: function (aggId, cmd, clb) {
    if (!aggId || !_.isString(aggId)) {
      var err = new Error('Please pass a valid aggregate id!');
      debug(err);
      throw err;
    }
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

    this.queue[aggId] = this.queue[aggId] || [];
    this.queue[aggId].push({ command: cmd, callback: clb })
  },

  /**
   * Returns next command in the queue
   * @param {String} aggId The passed aggregate id.
   * @returns {Object}
   */
  getNextCommandInQueue: function (aggId) {
    if (!aggId || !_.isString(aggId)) {
      var err = new Error('Please pass a valid aggregate id!');
      debug(err);
      throw err;
    }

    if (this.queue[aggId] && this.queue[aggId].length > 0) {
      var nextCmd = this.queue[aggId][0];
      return nextCmd;
    }

    return null;
  },

  /**
   * Removes the passed command from the queue.
   * @param {String} aggId The passed aggregate id.
   * @param {Object} cmd   The command to be queued.
   */
  removeCommandFromQueue: function (aggId, cmd) {
    if (!aggId || !_.isString(aggId)) {
      var err = new Error('Please pass a valid aggregate id!');
      debug(err);
      throw err;
    }

    _.remove(this.queue[aggId], function (c) {
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
   * @param {Object}   cmd         The command to be queued.
   * @param {String}   aggregateId The passed aggregateId (default).
   * @param {Function} callback    The function, that will be called when this action is completed.
   *                               `function(err, aggregate, stream, isNewSnapshotNeeded){}`
   */
  loadAggregate: function (cmd, aggregateId, callback) {
    if (!cmd || !_.isObject(cmd)) {
      var err = new Error('Please pass a valid command!');
      debug(err);
      throw err;
    }
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

    var toLoad = this.aggregate.getLoadInfo(cmd);

    var self = this;

    var firstToLoad = toLoad.shift();
    firstToLoad.aggregateId = firstToLoad.aggregateId || aggregateId;

    var aggregate = this.aggregate.create(aggregateId);

    var streams = [];

    var isNewSnapShotNeeded = false;

    if (this.aggregate.skipHistory) {
      debug('skip history for ', firstToLoad);
      if (this.aggregate.disablePersistence) {
        debug('persistency is disabled for ', firstToLoad);
        return callback(null, aggregate, streams);
      }
      var startLoadingOne = Date.now();
      // load aggregate with every stream
      this.eventStore.getLastEventAsStream(firstToLoad, function(err, stream) {
        if (err) {
          return callback(err);
        }

        var lastStreamRevInLoop = null;
        var events = _.map(stream.events, function (streamEvent) {
          if (lastStreamRevInLoop !== null && lastStreamRevInLoop + 1 !== streamEvent.streamRevision) {
            var msg = 'WARNING!!! Inconsistent event stream! Event with id (' + streamEvent.id + ') has a streamRevision of ' + streamEvent.streamRevision + ', but streamRevision in last event was ' + lastStreamRevInLoop + '!';
            var e = new Error(msg);
            debug(e);
            console.log(msg);
          }
          lastStreamRevInLoop = streamEvent.streamRevision;
          return streamEvent.payload;
        });

        var loadingTime = Date.now() - startLoadingOne;
        debug('needed ' + loadingTime + 'ms to load last event from the eventstore for: ', firstToLoad);

        streams.push(stream);

        self.aggregate.loadFromHistory(aggregate, null, events, loadingTime, stream, streams);

        // callback with the aggregate and the streams
        callback(null, aggregate, streams);
      });
      return;
    }

    function regularLoad (callback) {
      if (!hasAggregateName) {
        delete firstToLoad.aggregate;
      }

      if (!hasContextName) {
        delete firstToLoad.context;
      }

      var startLoading = Date.now();

      // load aggregate with every stream
      self.eventStore.getFromSnapshot(firstToLoad, function(err, snapshot, stream) {
        if (err) {
          return callback(err);
        }

        var ignoreSnapshot = false;

        if (snapshot) ignoreSnapshot = self.aggregate.shouldIgnoreSnapshot(snapshot);

        if (!ignoreSnapshot) {
          var lastStreamRevInLoop = null;
          var events = _.map(stream.events, function (streamEvent) {
            if (lastStreamRevInLoop !== null && lastStreamRevInLoop + 1 !== streamEvent.streamRevision) {
              var msg = 'WARNING!!! Inconsistent event stream! Event with id (' + streamEvent.id + ') has a streamRevision of ' + streamEvent.streamRevision + ', but streamRevision in last event was ' + lastStreamRevInLoop + '!';
              var e = new Error(msg);
              debug(e);
              console.log(msg);
            }
            lastStreamRevInLoop = streamEvent.streamRevision;
            return streamEvent.payload;
          });

          var loadingTime = Date.now() - startLoading;
          var addon = '';
          if (snapshot) {
            addon = ' and snapshot';
          }
          debug('needed ' + loadingTime + 'ms to load events' + addon + ' from the eventstore for: ', firstToLoad);

          isNewSnapShotNeeded = self.aggregate.loadFromHistory(aggregate, snapshot, [], loadingTime, stream);

          streams.push(stream);

          callback(null, events, stream, startLoading);
          return;
        }

        debug('skipping snapshot, and load whole event stream');

        startLoading = Date.now();
        self.eventStore.getEventStream(firstToLoad, function(err, stream) {
          if (err) {
            return callback(err);
          }

          var lastStreamRevInLoop = null;
          var events = _.map(stream.events, function (streamEvent) {
            if (lastStreamRevInLoop !== null && lastStreamRevInLoop + 1 !== streamEvent.streamRevision) {
              var msg = 'WARNING!!! Inconsistent event stream! Event with id (' + streamEvent.id + ') has a streamRevision of ' + streamEvent.streamRevision + ', but streamRevision in last event was ' + lastStreamRevInLoop + '!';
              var e = new Error(msg);
              debug(e);
              console.log(msg);
            }
            lastStreamRevInLoop = streamEvent.streamRevision;
            return streamEvent.payload;
          });

          loadingTime = Date.now() - startLoading;

          debug('needed ' + loadingTime + 'ms to load events from the eventstore');

          isNewSnapShotNeeded = self.aggregate.loadFromHistory(aggregate, null, events, loadingTime, stream);

          streams.push(stream);

          callback(null, events, stream, startLoading);
        });
      });
    }

    regularLoad(function (err, events, stream, totalLoadingTime) {
      if (err) {
        return callback(err);
      }

      async.eachSeries(toLoad, function (loadInfo, callback) {
        loadInfo.aggregateId = loadInfo.aggregateId || aggregateId;

        if (!hasAggregateName) {
          delete loadInfo.aggregate;
        }

        if (!hasContextName) {
          delete loadInfo.context;
        }

        var rev = aggregate.getRevision(loadInfo);

        var startLoading = Date.now();

        // load aggregate with every stream
        self.eventStore.getEventStream(loadInfo, rev, function(err, str) {
          if (err) {
            return callback(err);
          }

          var lastStreamRevInLoop = null;
          var evts = _.map(str.events, function (streamEvent) {
            if (lastStreamRevInLoop !== null && lastStreamRevInLoop + 1 !== streamEvent.streamRevision) {
              var msg = 'WARNING!!! Inconsistent event stream! Event with id (' + streamEvent.id + ') has a streamRevision of ' + streamEvent.streamRevision + ', but streamRevision in last event was ' + lastStreamRevInLoop + '!';
              var e = new Error(msg);
              debug(e);
              console.log(msg);
            }
            lastStreamRevInLoop = streamEvent.streamRevision;
            return streamEvent.payload;
          });

          var loadingTime = Date.now() - startLoading;
          debug('needed ' + loadingTime + 'ms to load events from the eventstore for: ', loadInfo);

          var notSameOrigin = loadInfo.aggregate && loadInfo.aggregate !== self.aggregate.name ||
                              loadInfo.context && loadInfo.context !== self.aggregate.context.name;

          var snapNeed = self.aggregate.loadFromHistory(aggregate, null, evts, loadingTime, str, null, notSameOrigin);

          if (!isNewSnapShotNeeded) {
            isNewSnapShotNeeded = snapNeed;
          }

          streams.push(str);

          callback(null);
        });
      }, function (err) {
        if (err) {
          return callback(err);
        }

        var loadingTime = Date.now() - totalLoadingTime;

        var snapNeed = self.aggregate.loadFromHistory(aggregate, null, events, loadingTime, stream, streams);

        if (!isNewSnapShotNeeded) {
          isNewSnapShotNeeded = snapNeed;
        }

        debug('check if new snapshot is needed');
        if (isNewSnapShotNeeded) {
          self.createSnapshot(aggregate, stream);
        }

        // callback with the aggregate and the streams
        callback(null, aggregate, streams);
      });
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
   * @param {Object}         cmd       The command.
   * @returns {AggregateDestroyedError}
   */
  isAggregateDestroyed: function (aggregate, cmd) {
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

    var contextName, aggregateName, aggregateId;

    if (!!this.definitions.command.context) {
      contextName = dotty.get(cmd, this.definitions.command.context);
    }

    if (!!this.definitions.command.aggregate) {
      aggregateName = dotty.get(cmd, this.definitions.command.aggregate);
    }

    if (!!this.definitions.command.aggregateId) {
      aggregateId = dotty.get(cmd, this.definitions.command.aggregateId);
    }

    var streamInfo = {
      context: contextName,
      aggregate: aggregateName,
      aggregateId: aggregateId
    };

    if (aggregate.isDestroyed()) {
      return new AggregateDestroyedError('Aggregate has already been destroyed!', {
        aggregateId: aggregate.id,
        aggregateRevision: aggregate.getRevision(streamInfo)
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
    if (revisionInCommand === null || revisionInCommand === undefined) {
      return null;
    }

    var contextName, aggregateName, aggregateId;

    if (!!this.definitions.command.context) {
      contextName = dotty.get(cmd, this.definitions.command.context);
    }

    if (!!this.definitions.command.aggregate) {
      aggregateName = dotty.get(cmd, this.definitions.command.aggregate);
    }

    if (!!this.definitions.command.aggregateId) {
      aggregateId = dotty.get(cmd, this.definitions.command.aggregateId);
    }

    var streamInfo = {
      context: contextName,
      aggregate: aggregateName,
      aggregateId: aggregateId
    };

    if (revisionInCommand === aggregate.getRevision(streamInfo)) {
      return null;
    }

    return new AggregateConcurrencyError('Actual revision in command is "' + revisionInCommand + '", but expected is "' + aggregate.getRevision(streamInfo) + '"!', {
      aggregateId: aggregate.id,
      aggregateRevision: aggregate.getRevision(streamInfo),
      commandRevision: revisionInCommand
    });
  },

  /**
   * Returns an error if the command is not valid.
   * @param {Object} cmd The command.
   * @returns {ValidationError}
   */
  validateCommand: function (cmd, callback) {
    if (!cmd || !_.isObject(cmd)) {
      debug(err);
      return callback(new Error('Please pass a valid command!'), null);
    }
    return this.aggregate.validateCommand(cmd, callback);
  },

  checkPreLoadConditions: function (cmd, clb) {
    this.aggregate.checkPreLoadConditions(cmd, clb);
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

    var reason = this.isAggregateDestroyed(aggregate, cmd);
    if (reason) {
      return reason;
    }

    if (this.aggregate.disablePersistence) return;

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

      if (workerIds.length === 1 && workerIds[0] === self.id) {
        return callback(null);
      }

      var err = new ConcurrencyError('Aggregate is locked by an other command handler!');
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
   * @param {Array}          streams   The event streams.
   * @param {Function}       callback  The function, that will be called when this action is completed.
   *                                   `function(err, eventsToDispatch){}`
   */
  commit: function (aggregate, streams, callback) {
    if (!aggregate || !_.isObject(aggregate)) {
      var err = new Error('Please pass a valid aggregate!');
      debug(err);
      throw err;
    }
    if (!streams || !_.isArray(streams)) {
      var err = new Error('Please pass valid streams!');
      debug(err);
      throw err;
    }
    if (!callback || !_.isFunction(callback)) {
      var err = new Error('Please pass a valid callback!');
      debug(err);
      throw err;
    }

    var uncommitedEvents = aggregate.getUncommittedEvents();

    if (uncommitedEvents.length === 0) {
      debug('no events generated');
      return callback(null, []);
    }

    var self = this;

    var evtsToDispatch = [];
    var fakeEventStream = {
      aggregateId: dotty.get(uncommitedEvents[0], self.definitions.event.aggregateId),
      aggregate: dotty.get(uncommitedEvents[0], self.definitions.event.aggregate),
      context: dotty.get(uncommitedEvents[0], self.definitions.event.context),
      uncommittedEvents: []
    };

    for (var e in uncommitedEvents) {
      var evt = uncommitedEvents[e];

      var stream = _.find(streams, function (s) {
        return s.context === dotty.get(evt, self.definitions.event.context) &&
          s.aggregate === dotty.get(evt, self.definitions.event.aggregate) &&
          s.aggregateId === dotty.get(evt, self.definitions.event.aggregateId);
      });

      if (!stream && !self.aggregate.disablePersistence) {
        debug('no stream found for:', evt);
        return callback(new Error('No event stream found for evt with id:' + dotty.get(evt, self.definitions.event.id)));
      }

      if (stream) stream.addEvent(evt);

      if (!stream && self.aggregate.disablePersistence) {
        var eventStoreEvent = new EventFromEventStore(fakeEventStream, evt, self.eventStore.eventMappings);
        eventStoreEvent.disablePersistence = true;
        eventStoreEvent.id = uuid().toString();
        evtsToDispatch.push(eventStoreEvent);
      }
    }

    async.each(streams, function (stream, callback) {
      if (self.aggregate.disablePersistence) {
        for (var ie = 0, evtLength = stream.uncommittedEvents.length; ie < evtLength; ie++) {
          stream.uncommittedEvents[ie].disablePersistence = true;
          stream.uncommittedEvents[ie].id = uuid().toString();
          evtsToDispatch.push(stream.uncommittedEvents[ie]);
        }
        return callback(null);
      }
      stream.commit(function (err, stream) {
        if (err) {
          return callback(err);
        }

        evtsToDispatch = evtsToDispatch.concat(stream.eventsToDispatch);

        callback(null);
      });
    }, function (err) {
      if (err) {
        return callback(err);
      }

      callback(null, evtsToDispatch);
    });
  },

  /**
   * Executes the default workflow to handle a command.
   * @param {String}   aggId    The passed aggregate id.
   * @param {Object}   cmd      The passed command.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, eventsToDispatch){}`
   */
  workflow: function (aggId, cmd, callback) {
    if (!aggId || !_.isString(aggId)) {
      var err = new Error('Please pass a valid aggregate id!');
      debug(err);
      throw err;
    }
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

    var agg = null;
    var meta = {
      aggregateId: aggId,
      aggregate: this.aggregate ? this.aggregate.name : undefined,
      context: this.aggregate && this.aggregate.context ? this.aggregate.context.name : undefined
    };

    var concatenatedId = this.getConcatenatedId(aggId, cmd);

    var hadNoAggregateId = !dotty.exists(cmd, this.definitions.command.aggregateId);

    async.waterfall([

      // validate command
      function (clb) {
        debug('validate command');
        self.validateCommand(cmd, clb);
      },

//      // check aggregate lock
//      function (clb) {
//        if (hadNoAggregateId) return clb(null);
//        debug('check aggregate lock');
//        self.checkAggregateLock(aggId, clb);
//      },

      // check the pre-load conditions: this is run before the aggregate is locked to allow non-(b)locking checks
      function (clb) {
        debug('check the pre-load conditions');
        self.checkPreLoadConditions(cmd, clb);
      },

      // lock aggregate
      function (clb) {
        if (hadNoAggregateId) return clb(null);
        debug('lock aggregate');
        self.lockAggregate(concatenatedId, clb);
      },

      // load aggregate
      function (clb) {
        debug('load aggregate');
        self.loadAggregate(cmd, aggId, clb);
      },

      // verify aggregate
      function (aggregate, streams, clb) {
        agg = aggregate; // save it temporary so we can use it in the callback

        debug('verify aggregate');
        var err = self.verifyAggregate(aggregate, cmd);
        if (err) {
          return clb(err);
        }
        clb(null, aggregate, streams);
      },

      // handle command and check business rules
      function (aggregate, streams, clb) {
        debug('handle command');
        self.letHandleCommandByAggregate(aggregate, cmd, function (err) { // err is a business rule error
          if (err) {
            return clb(err);
          }
          clb(null, aggregate, streams);
        });
      },

      // check aggregate lock
      function (aggregate, streams, clb) {
        if (hadNoAggregateId) return clb(null, aggregate, streams);
        debug('check aggregate lock');
        self.checkAggregateLock(concatenatedId, function (err) {
          clb(err, aggregate, streams);
        });
      },

      // commit new aggregate events
      function (aggregate, streams, clb) {
        debug('commit new aggregate events');
        self.commit(aggregate, streams, clb);
      }

    ], function (err, eventsToDispatch) {
      if (agg && agg.getRevision() === 0) {
        agg = null;
      }

      if (hadNoAggregateId) {
        if (callback.length > 2) {
          return callback(err, eventsToDispatch || null, agg ? agg.toJSON() : null, meta);
        }

        return callback(err, eventsToDispatch || null);
      }

      // unlock...
      debug('unlock aggregate');

      self.resolveAggregateLock(concatenatedId, function (errLock) {
        if (errLock) {
          debug(errLock);
          return callback(errLock);
        }

        if (err) {
          debug(err);

          if (err instanceof ConcurrencyError) {
            var retryIn = randomBetween(0, self.options.retryOnConcurrencyTimeout); // could be overwritten in a custom commandHandler?
            debug('retry in ' + retryIn + 'ms');
            setTimeout(function() {
              self.workflow(aggId, cmd, callback);
            }, retryIn);
            return;
          }

          if (callback.length > 2) {
            return callback(err, null, agg ? agg.toJSON() : null, meta);
          }

          return callback(err, null);
        }

        if (callback.length > 2) {
          return callback(null, eventsToDispatch || null, agg ? agg.toJSON() : null, meta);
        }

        callback(null, eventsToDispatch || null);
      });
    });
  },

  /**
   * Returns the concatenated id (more unique)
   * @param {String}   aggId The passed aggregate id.
   * @param {Object}   cmd   The passed command.
   * @returns {string}
   */
  getConcatenatedId: function (aggId, cmd) {
    var aggregate = '';
    if (dotty.exists(cmd, this.definitions.command.aggregate)) {
      aggregate = dotty.get(cmd, this.definitions.command.aggregate);
    }

    var context = '';
    if (dotty.exists(cmd, this.definitions.command.context)) {
      context = dotty.get(cmd, this.definitions.command.context);
    }

    return context + aggregate + aggId;
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

    function _handle (aggId) {
      var concatenatedId = self.getConcatenatedId(aggId, cmd);

      var isFirst = !self.getNextCommandInQueue(concatenatedId);

      self.queueCommand(concatenatedId, cmd, callback);

      if (!isFirst) {
        return;
      }

      (function handleNext (aggregateId, c) {
        var concId = self.getConcatenatedId(aggregateId, c);
        var cmdEntry = self.getNextCommandInQueue(concId);
        if (cmdEntry) {
          if (cmdEntry.callback.length > 2) {
            self.workflow(aggregateId, cmdEntry.command, function (err, evts, aggData, meta) {
              self.removeCommandFromQueue(concId, cmdEntry.command);
              handleNext(aggregateId, cmdEntry.command);
              cmdEntry.callback(err, evts, aggData, meta);
            });
            return;
          }
          self.workflow(aggregateId, cmdEntry.command, function (err, evts) {
            self.removeCommandFromQueue(concId, cmdEntry.command);
            handleNext(aggregateId, cmdEntry.command);
            cmdEntry.callback(err, evts);
          });
        }
      })(aggId, cmd);
    }

    if (dotty.exists(cmd, this.definitions.command.aggregateId)) {
      return _handle(dotty.get(cmd, this.definitions.command.aggregateId));
    }

    debug('no aggregateId in command, so generate a new one');

    this.getNewAggregateId(cmd, function (err, id) {
      if (err) {
        debug(err);
        return callback(err);
      }

      return _handle(id);
    });
  },

  /**
   * Inject idGenerator function for aggregate id.
   * @param   {Function} fn           The function to be injected.
   * @returns {DefaultCommandHandler} to be able to chain...
   */
  aggregateIdGenerator: function (fn) {
    if (fn.length === 0) {
      fn = _.wrap(fn, function(func, callback) {
        callback(null, func());
      });
    }

    this.getNewAggregateIdFn = fn;

    return this;
  },

  /**
   * IdGenerator function for aggregate id.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, newId){}`
   */
  getNewAggregateId: function (cmd, callback) {
    var getNewIdFn = this.eventStore.getNewId.bind(this.eventStore);
    if (this.aggregate && this.aggregate.getNewAggregateId) {
      getNewIdFn = this.aggregate.getNewAggregateId.bind(this.aggregate);
    } else if (this.getNewAggregateIdFn) {
      getNewIdFn = this.getNewAggregateIdFn.bind(this);
    }

    if (getNewIdFn.length === 2) {
      return getNewIdFn(cmd, callback);
    }

    getNewIdFn(callback);
  }

});

module.exports = DefaultCommandHandler;
