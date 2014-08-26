'use strict';

var Definition = require('./definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:defaultCommandHandler'),
  dotty = require('dotty'),
  async = require('async'),
  uuid = require('node-uuid').v4;

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function DefaultCommandHandler (aggregate) {
  Definition.call(this);
  
  this.id = uuid().toString();
  this.queue = {};
  
  this.aggregate = aggregate;
}

util.inherits(DefaultCommandHandler, Definition);

_.extend(DefaultCommandHandler.prototype, {

  useEventStore: function (eventStore) {
    this.eventStore = eventStore;
  },

  useAggregateLock: function (aggregateLock) {
    this.aggregateLock = aggregateLock;
  },

  queueCommand: function (cmd, clb) {
    var aggregateId = dotty.get(cmd, this.definitions.command.aggregateId);
    
    this.queue[aggregateId] = this.queue[aggregateId] || [];
    this.queue[aggregateId].push({ command: cmd, callback: clb })
  },

  getNextCommandInQueue: function (previousCmd) {
    var aggregateId = dotty.get(previousCmd, this.definitions.command.aggregateId);
    if (this.queue[aggregateId].length > 0) {
      var nextCmd = this.queue[aggregateId].shift();
      return nextCmd;
    }

    return null;
  },

  dequeueCommand: function (cmd) {
    var aggregateId = dotty.get(cmd, this.definitions.command.aggregateId);
    
    this.queue[aggregateId] = _.reject(this.queue[aggregateId], function(c) {
      return c.command === cmd;
    });
  },
  
  lockAggregate: function (aggregateId, callback) {
    this.aggregateLock.reserve(this.id, aggregateId, callback);
  },

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
  
  createSnapshot: function (aggregate, stream) {
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
          return debug(err);
        }
        debug('snapshot created');
      });
    });
  },
  
  isAggregateDestroyed: function (aggregate) {
    if (aggregate.isDestroyed()) {
      return {
        name: 'AggregateDestroyed',
        message: 'Aggregate has already been destroyed!',
        aggregateRevision: aggregate.getRevision(),
        aggregateId: aggregate.id
      };
    }
    
    return false;
  },

  isRevisionWrong: function (aggregate, cmd) {
    var hasRevision = !!this.definitions.command.revision;
    
    if (!hasRevision) {
      return false;
    }
    
    var revisionInCommand = dotty.get(cmd, this.definitions.command.revision);
    if (revisionInCommand === aggregate.getRevision()) {
      return false;
    }
    
    return {
      name: 'ConcurrencyError',
      message: 'Actual revision in command is "' + revisionInCommand + '", but expected is "' + aggregate.getRevision() + '"!',
      aggregateRevision: aggregate.getRevision(),
      aggregateId: aggregate.id,
      commandRevision: revisionInCommand
    };
  },
  
  verify: function (aggregate, cmd) {
    var reason = this.isAggregateDestroyed(aggregate);
    if (reason) {
      return reason;
    }
    
    reason = this.isRevisionWrong(aggregate, cmd);
    if (reason) {
      return reason;
    }

    reason = this.aggregate.validateCommand(cmd);
    if (reason) {
      return reason;
    }
    
    return null;
  },

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
  
  resolveAggregateLock: function (aggregateId, cmd, callback) {
    this.aggregateLock.resolve(aggregateId, callback);
  },
  
  commit: function (aggregate, stream, callback) {
    var uncommitedEvents = aggregate.getUncommittedEvents();

    var cmdId = dotty.get(this.definitions.command.id);
    
    var hasMeta = !!this.definitions.command.meta && !!this.definitions.event.meta;
    
    var self = this;
    
    _.map(uncommitedEvents, function (evt) {
      dotty.put(evt, self.definitions.event.id, uuid().toString());
      dotty.put(evt, self.definitions.event.correlationId, cmdId);
      
      if (hasMeta) {
        dotty.put(evt, self.definitions.event.meta, dotty.get(cmd, self.definitions.command.meta));
      }
    });
    
    stream.addEvents(uncommitedEvents);

    stream.commit(function (err, stream) {
      if (err) {
        return callback(err);
      }
      
      callback(null, stream.eventsToDispatch);
    });
  },
  
  workflow: function (cmd, callback) {
    
    var aggregateId = dotty.get(cmd, this.definitions.command.aggregateId);

    var self = this;

    async.waterfall([
        
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

      // verify command
      function (aggregate, stream, clb) {
        debug('verify command');
        var err = self.verify(aggregate, cmd);
        if (err) {
          return callback(err);
        }
        clb(null, aggregate, stream);
      },
      
      // handle command and check business rules
      function (aggregate, stream, clb) {
        debug('handle command');
        aggregate.handle(cmd, function (err) { // err is a business rule error
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
