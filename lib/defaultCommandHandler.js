'use strict';

var Definition = require('./definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:defaultCommandHandler'),
  dotty = require('dotty'),
  async = require('async'),
  uuid = require('node-uuid').v4;

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
    return false;
  },
  
  workflow: function (cmd, callback) {
    
    var aggregateId = dotty.get(cmd, this.definitions.command.aggregateId);

    var self = this;

    async.waterfall([
        
      // lock aggregate
      function (callback) {
        debug('lock aggregate');
        self.lockAggregate(aggregateId, callback);
      },

      // load aggregate
      function (callback) {
        debug('load aggregate');
        self.loadAggregate(aggregateId, callback);
      },
      
      // check if new snapshot is needed
      function (aggregate, stream, isNewSnapShotNeeded, callback) {
        debug('check if new snapshot is needed');
        if (isNewSnapShotNeeded) {
          self.createSnapshot(aggregate, stream);
        }
        callback(null, aggregate, stream);
      },

      // verify command
      function (aggregate, stream) {
        debug('verify command');
        var err = self.verify(aggregate, cmd);
        if (err) {
          return callback(err);
        }
        callback(null, aggregate, stream);
      }

    ], function (err) {
      if (err) {
        debug(err);
      }
      callback(err);
    });
  },

  handle: function (cmd, callback) {
    var self = this;
    
    function _handle () {
      self.queueCommand(cmd, callback);

      (function handleNext(nextCommand) {
        var cmdEntry = self.getNextCommandInQueue(nextCommand);
        if (cmdEntry) {
          self.workflow(cmdEntry.command, function (err) {
            self.dequeueCommand(cmdEntry.command);
            handleNext(cmdEntry.command);
            cmdEntry.callback(err); // TODO: callback events too!!!!!!
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
