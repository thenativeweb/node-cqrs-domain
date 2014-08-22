var eventEmitter = require('../eventEmitter'),
    async = require('async'),
    _ = require('lodash');

var SagaHandler = {};
SagaHandler.prototype = {

  sagas: {},

  initialize: function(callback) {

    var self = this;

    function initSaga(id, data, callback) {
      var saga = new self.Saga(id);
      saga.commit = function(callback) {
        self.commit(this, callback);
      };
      self.sagas[id] = saga;
      saga.load(data, callback);
    }

    this.repository.find({ type: this.saga }, function(err, sagas) {
      if (!err) {
        async.forEach(sagas, function(saga, callback) {
          initSaga(saga.id, saga, callback);
        }, callback);
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
        saga.transition(evt, function(err) {
          callback(err, saga);
        });
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
      vm.set('type', self.saga);
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
    if (this[evt.event] &&
        evt.head &&
        evt.head.version !== null &&
        evt.head.version !== undefined &&
        this[evt.event + '_' + evt.head.version]) {
      this[evt.event + '_' + evt.head.version](evt);
      return;
    }

    if (this[evt.event]) {
      this[evt.event](evt);
      return;
    }

    this.defaultHandle(evt.payload.id, evt);
  },

  loadSaga: function(id, callback) {
    var self = this;
    // var saga = this.sagas[id];
    // if (!saga) {
      saga = new this.Saga(id);
      saga.commit = function(callback) {
        self.commit(this, callback);
      };
      this.repository.get(id, function(err, sagaData) {
        self.sagas[id] = saga;
        saga.load(sagaData, function(err) {
          callback(err, saga);
        });
      });
    // } else {
    //   callback(null, saga);
    // }
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