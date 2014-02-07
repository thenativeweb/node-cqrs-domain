var eventEmitter = require('../eventEmitter'),
    async = require('async'),
    _ = require('lodash'),
    util = require('util'),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    uuid = require('node-uuid').v4;

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

var CommandHandler = function() {
  EventEmitter2.call(this, {
    wildcard: true,
    delimiter: ':',
    maxListeners: 1000 // default would be 10!
  });

  this.buffered = {};
  this.id = uuid().toString();
};

util.inherits(CommandHandler, EventEmitter2);

_.extend(CommandHandler.prototype, {

  defaultHandle: function(id, cmd, callback) {

    var self = this;

    async.waterfall([

      // load aggregate
      function(callback) {
        self.loadAggregate(id, callback);
      },

      // reject command if aggregate has already been destroyed
      function(aggregate, stream, callback) {
        if(aggregate.get('destroyed')) {
          var reason = {
            name: 'AggregateDestroyed',
            message: 'Aggregate has already been destroyed!',
            aggregateRevision: aggregate.get('revision'),
            aggregateId: aggregate.id
          };
          return callback(reason);
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
        self.validate(cmd, function(err) {
          callback(err, aggregate, stream);
        });
      },

      // call command function on aggregate
      function(aggregate, stream, callback) {
        self.handleCommand(aggregate, cmd, function(err) {
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
      if (callback) callback(err);
      self.finish(id, cmd, err);
    });
  },

  handleCommand: function(aggregate, cmd, callback) {
    if (cmd.head &&
        cmd.head.version !== null &&
        cmd.head.version !== undefined &&
        aggregate[cmd.command + '_' + cmd.head.version]) {
      aggregate[cmd.command + '_' + cmd.head.version](cmd.payload, function(err) {
        if (callback) callback(err);
      });
      return;
    }

    aggregate[cmd.command](cmd.payload, function(err) {
      if (callback) callback(err);
    });
  },

  reorderCommandLock: function(id, callback) {
    var self = this;
    this.commandLock.find({ aggregateId: id }, function(err, res) {
      res = res || [];
      res = _.sortBy(res, function(item) {
        return item.id === self.id;
      });

      async.each(res, function(item, callback) {
        item.destroy();
        self.commandLock.commit(item, callback);
      }, callback);
    });
  },

  finish: function(id, cmd, err) {
    var self = this;

    function _finish() {
      if (err) {
        eventEmitter.emit('commandRejected', cmd, err);
      }
      eventEmitter.emit('handled:' + cmd.command, id, cmd);
      self.emit('handled:' + id + ':' + cmd.id, id, cmd);
    }
    if (this.commandLock) {
      this.reorderCommandLock(id, function() {
        _finish();
      });
    } else {
      _finish();
    }
  },

  commit: function(cmd, aggregate, stream, callback) {
    var self = this;

    function _commit() {
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
    }

    if (this.commandLock) {
      this.commandLock.find({ aggregateId: aggregate.id }, function(err, res) {
        res = res || [];
        if (res.length !== 1 || res[0].id !== self.id) {
          // concurrency exception!!!
          self.reorderCommandLock(aggregate.id, function() {
            // retry
            setTimeout(function() {
              self._handle(aggregate.id, cmd);
            }, randomBetween(0, self.options.retryOnConcurrencyTimeout));
          });
        } else {
          _commit();
        }
      });
    } else {
      _commit();
    }
  },

  validate: function(cmd, callback) {
    if (this.validationRules &&
        cmd.head &&
        cmd.head.version !== null &&
        cmd.head.version !== undefined &&
        this.validationRules[cmd.command + '_' + cmd.head.version]) {
      this.validationRules[cmd.command + '_' + cmd.head.version].validate(cmd.payload, callback);
      return;
    }

    if (this.validationRules && this.validationRules[cmd.command]) {
      this.validationRules[cmd.command].validate(cmd.payload, callback);
      return;
    }

    callback(null);
  },

  _handle: function(id, cmd) {
    if (this[cmd.command]) {
      this[cmd.command](id, cmd);
    } else {
      this.defaultHandle(id, cmd);
    }
  },

  handle: function(id, cmd) {
    var self = this;

    this.buffered[id] = this.buffered[id] || [];
    this.buffered[id].push({ id: id, cmd: cmd });

    this.once('handled:' + id + ':' + cmd.id, function(id, cmd) {
      self.buffered[id] = _.reject(self.buffered[id], function(entry) {
        return entry.id === id && entry.cmd === cmd;
      });

      if (self.buffered[id].length > 0) {
        var nextCmd = self.buffered[id][0];
        self._handle(nextCmd.id, nextCmd.cmd);
      }
    });
        
    if (this.buffered[id].length === 1) {
      this._handle(id, cmd);
    }
  },

  loadAggregate: function(id, callback) {
    var self = this;

    function _loadAggregate() {
      var aggregate = new self.Aggregate(id);
      self.eventStore.getFromSnapshot(id, function(err, snapshot, stream) {
        async.map(stream.events, function(evt, next) {
          next(null, evt.payload);
        }, function(err, events) {
          aggregate.loadFromHistory(snapshot, events);

          // Check if snapshotting is needed.
          var snapshotThreshold = aggregate.getSnapshotThreshold() || self.options.snapshotThreshold;
          if (stream.events.length >= snapshotThreshold) {
            var streamId = stream.streamId,
                revision = stream.currentRevision(),
                data = aggregate.toJSON(),
                version = aggregate.version;

            process.nextTick(function() {
              self.eventStore.createSnapshot(streamId, revision, data, version);
            });
          }

          callback(null, aggregate, stream);
        });
      });
    }

    if (this.commandLock) {
      this.commandLock.get(this.id, function(err, res) {
        res.set('aggregateId', id);
        self.commandLock.commit(res, function() {
          _loadAggregate();
        });
      });
    } else {
      _loadAggregate();
    }
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

    if (module.commit && module.get && module.find) {
      this.commandLock = module;
    }
  }

});

module.exports = {

  extend: function(obj) {
    return _.extend(new CommandHandler(), obj);
  }

};