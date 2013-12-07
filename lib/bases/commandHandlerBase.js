var eventEmitter = require('../eventEmitter'),
    async = require('async'),
    _ = require('lodash');

var CommandHandler = {};
CommandHandler.prototype = {

  defaultHandle: function(id, cmd) {

    var self = this;

    async.waterfall([

      // load aggregate
      function(callback) {
        self.loadAggregate(id, callback);
      },

      // reject command if aggregate has already been destroyed
      function(aggregate, stream, callback) {
        if(aggregate.get('destroyed')) {
          return callback('Aggregate has already been destroyed!');
        }
        
        callback(null, aggregate, stream);
      },

      // check revision
      function(aggregate, stream, callback) {
        self.checkRevision(cmd, aggregate.get('revision'), function(err) {
          callback(err, aggregate, stream);
        });
      },

      // call validate command
      function(aggregate, stream, callback) {
        self.validate(cmd.command, cmd.payload, function(err) {
          callback(err, aggregate, stream);
        });
      },

      // call command function on aggregate
      function(aggregate, stream, callback) {
        aggregate[cmd.command](cmd.payload, function(err) {
          callback(err, aggregate, stream);
        });
      },

      // commit the new events
      function(aggregate, stream, callback) {
        self.commit(cmd, aggregate, stream, callback);
      }
    ],

    // finally publish commandRejected event on error
    function(err) {
      self.finish(id, cmd, err);
    });
  },

  finish: function(id, cmd, err) {
    if (err) {
      eventEmitter.emit('commandRejected', cmd, err);
    }
    eventEmitter.emit('handled:' + cmd.command, id, cmd);
  },

  commit: function(cmd, aggregate, stream, callback) {
      
    var self = this;

    async.concat(aggregate.uncommittedEvents, function(evt, next) {
      evt.commandId = cmd.id;
      if (cmd.head) {
        evt.head = _.extend(_.clone(cmd.head), evt.head);
      }

      self.getNewId(function(err, id) {
        evt.id = id;
        stream.addEvent(evt);
        next(err);
      });
    },
    // final
    function(err) {
      if (callback && err) { callback(err); }
      if (!err) {
        stream.commit(function(err, stream) {
          if (err) {
            if (callback) { callback(err); }
            return;
          }

          async.each(stream.eventsToDispatch,
            function(evtToSetDispatched, clb) {
              self.publisher.publish(evtToSetDispatched.payload);
              self.eventStore.setEventToDispatched(evtToSetDispatched, clb);
            },
            function(err) {
              if (callback) { callback(err); }
            }
          );
        });
      }
    });
  },

  validate: function(ruleName, data, callback) {
    if(this.validationRules && this.validationRules[ruleName]) {
      this.validationRules[ruleName].validate(data, callback);
    } else {
      callback(null);
    }
  },

  handle: function(id, cmd) {
    if (this[cmd.command]) {
      this[cmd.command](id, cmd);
    } else {
      this.defaultHandle(id, cmd);
    }
  },

  loadAggregate: function(id, callback) {
    var self = this;
    var aggregate = new this.Aggregate(id);
    this.eventStore.getFromSnapshot(id, function(err, snapshot, stream) {
      async.map(stream.events, function(evt, next) {
        next(null, evt.payload);
      }, function(err, events) {
        aggregate.loadFromHistory(snapshot.data, events);

        // Check if snapshotting is needed.
        var snapshotThreshold = aggregate.getSnapshotThreshold() || self.options.snapshotThreshold;
        if (stream.events.length >= snapshotThreshold) {
          var streamId = stream.streamId,
              revision = stream.currentRevision(),
              data = aggregate.toJSON();

          process.nextTick(function() {
            self.eventStore.createSnapshot(streamId, revision, data);
          });
        }

        callback(null, aggregate, stream);
      });
    });
  },

  getNewId: function(callback) {
    this.eventStore.getNewIdFromStorage(callback);
  },

  checkRevision: function(cmd, aggRev, callback) {
    if(!cmd.head || cmd.head.revision === undefined ||
      (cmd.head && cmd.head.revision === aggRev)) {
      return callback(null);
    }

    callback('Concurrency exception. Actual ' +
      cmd.head.revision + ' expected ' + aggRev);
  },

  configure: function(fn) {
    fn.call(this);
    return this;
  },

  use: function(module) {
    if (!module) return;

    if (module.getFromSnapshot) {
      this.eventStore = module;
    }

    if (module.publish) {
      this.publisher = module;
    }
  }

};

module.exports = {

  extend: function(obj) {
    return _.extend(_.clone(CommandHandler.prototype), obj);
  }

};