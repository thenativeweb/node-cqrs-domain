var eventEmitter = require('../eventEmitter')
  , async = require('async')
  , _ = require('underscore');

var SagaHandler = {};
SagaHandler.prototype = {

    sagas: {},

    initialize: function() {

        var self = this;

        function initSaga(id, stream) {
            var saga = new this.Saga(id);
            async.map(stream.events, function(evt, next) {
                next(null, evt.payload);
            }, function(err, events) {
                saga.loadFromHistory(events);
                saga.isInited = true;
                self.sagas[id] = { saga: saga, stream: stream };
            });
        }

        this.eventStore.getEventStreams(this.saga, function(err, sagaStreams) {
            if (!err) {
                for(var i = 0, len = sagaStreams.length; i < len; i++) {
                    var stream = sagaStreams[i];
                    initSaga(stream.streamId, stream);
                }
            }
        });

    },

    defaultHandle: function(id, evt) {

        var self = this;

        async.waterfall([

            // load saga
            function(callback) {
                self.loadSaga(id, callback);
            },

            // transition the event
            function(saga, stream, callback) {
                saga.transition(evt);
                callback(null, saga, stream);
            },

            // commit the uncommittedEvents
            function(saga, stream, callback) {
                if (saga.destroyed) {
                    stream.remove(function(err) {
                        callback(err, saga);
                    });
                } else {
                    self.commit(saga.uncommittedEvents, stream, function(err) {
                        callback(err, saga);
                    });
                }
            }
        ],

        // finally
        function(err, saga) {
            if (!err) {
            }
        });

    },

    commit: function(uncommittedEvents, stream, callback) {
        if (uncommittedEvents.length > 0) {
            for(var i = 0, len = uncommittedEvents.length; i < len; i++) {
                var evt = uncommittedEvents[i];
                stream.addEvent(evt);
            }
            stream.commit(callback);
        } else {
            callback(null);
        }
    },

    handle: function(evt) {
        if (this[evt.event]) {
            this[evt.event](evt);
        } else {
            this.defaultHandle(evt.payload.id, evt);
        }
    },

    loadSaga: function(id, callback) {
        var self = this;
        var saga = this.sagas[id];
        if (!saga) {
            saga = { saga: new this.Saga(id) };
            this.eventStore.getEventStream(id, function(err, stream) {
                saga.stream = stream;
                async.map(stream.events, function(evt, next) {
                    next(null, evt.payload);
                }, function(err, events) {
                    saga.saga.loadFromHistory(events);
                    saga.saga.unemittedCommands = [];
                    saga.saga.isInited = true;
                    self.sagas[id] = saga;
                    callback(null, saga.saga, saga.stream);
                });
            });
        } else {
            callback(null, saga.saga, saga.stream);
        }
    },

    configure: function(fn) {
        fn.call(this);
        return this;
    }, 

    use: function(module) {
        if (!module) return;
    
        if (module.getEventStreams) {
            this.eventStore = module;
        }
    }

};

module.exports = {

    extend: function(obj) {
        return _.extend(_.clone(SagaHandler.prototype), obj);
    }

};