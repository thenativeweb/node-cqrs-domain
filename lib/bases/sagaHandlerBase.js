var eventEmitter = require('../eventEmitter')
  , async = require('async')
  , _ = require('underscore');

var SagaHandler = {};
SagaHandler.prototype = {

    sagas: {},

    initialize: function() {

        var self = this;

        function initSaga(id, data) {
            var saga = new this.Saga(id);
            saga.load(data);
            self.sagas[id] = saga;
        }

        this.repository.find({ type: this.saga }, function(err, sagas) {
            if (!err) {
                for(var i = 0, len = sagas.length; i < len; i++) {
                    var saga = sagas[i];
                    initSaga(stream.id, saga);
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
            function(saga, callback) {
                saga.transition(evt);
                callback(null, saga);
            },

            // commit the uncommittedEvents
            function(saga, callback) {
                self.commit(saga, callback);
            }
        ],

        // finally
        function(err) {
            if (!err) {
            }
        });

    },

    commit: function(saga, callback) {
        var self = this;
        this.repository.get(saga.id, function(err, vm) {
            if (saga.get('destroyed')) {
                vm.destroy();
            } else {
                vm.set(saga.toJSON());
            }
            self.repository.commit(vm, function(err) {
                callback(err);
            });
        });
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
            saga = new this.Saga(id);
            this.repository.get(id, function(err, sagaData) {
                saga.load(sagaData);
                self.sagas[id] = saga;
                callback(null, saga);
            });
        } else {
            callback(null, saga);
        }
    },

    configure: function(fn) {
        fn.call(this);
        return this;
    }, 

    use: function(module) {
        if (!module) return;
    
        if (module.commit) {
            this.repository = module;
        }
    }

};

module.exports = {

    extend: function(obj) {
        return _.extend(_.clone(SagaHandler.prototype), obj);
    }

};