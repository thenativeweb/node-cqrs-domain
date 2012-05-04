var eventEmitter = require('../eventEmitter')
  , async = require('async')
  , _ = require('underscore');

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
                aggregate.validate(cmd.command, cmd.payload, function(err) {
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
                self.commit(cmd.id, aggregate.uncommittedEvents, stream);
                callback(null);
            }
        ],

        // finally publish commandRejected event on error
        function(err) {
            if (err) {
                eventEmitter.emit('commandRejected', cmd, err);
            }
            eventEmitter.emit('handled:' + cmd.command, id, cmd);
        });

    },

    commit: function(cmdId, uncommittedEvents, stream, callback) {
        
        var self = this;

        async.concat(uncommittedEvents, function(evt, next) {
            evt.commandId = cmdId;

            self.eventStore.getNewIdFromStorage(function(err, id) {
                evt.id = id;
                stream.addEvent(evt);
                next(err);
            });
        },
        // final
        function(err) {
            if (!err) {
                stream.commit(function(err) {
                    // Check if snapshotting is needed.
                    if (stream.events.length >= self.options.snapshotThreshold) {
                        self.eventstore.createSnapshot(stream.streamId, stream.currentRevision(), aggregate.toJSON());
                    }
                });
            }
        });
    },

    handle: function(id, cmd) {
        if (this[cmd.command]) {
            this[cmd.command](id, cmd);
        } else {
            this.defaultHandle(id, cmd);
        }
    },

    loadAggregate: function(id, callback) {
        var aggregate = new this.Aggregate(id);
        this.eventStore.getFromSnapshot(id, function(err, snapshot, stream) {
            async.map(stream.events, function(evt, next) {
                next(null, evt.payload);
            }, function(err, events) {
                aggregate.loadFromHistory(snapshot, events);
                callback(null, aggregate, stream); 
            });
        });
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
    }

};

module.exports = {

    extend: function(obj) {
        return _.extend(_.clone(CommandHandler.prototype), obj);
    }

};