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

  },
  
  workflow: function (cmd, callback) {
    
    var aggregateId = dotty.get(cmd, this.definitions.command.aggregateId);

    var self = this;

    async.series([
        
      // lock aggregate
      function (callback) {
        self.lockAggregate(aggregateId, callback);
      },

      // load aggregate
      function (callback) {
        self.loadAggregate(aggregateId, callback);
      }

    ], function (err) {
      
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
            cmdEntry.callback(err); // callback events too!!!!!!
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
