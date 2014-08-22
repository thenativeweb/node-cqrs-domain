var utils = require('../utils'),
   eventEmitter = require('../eventEmitter'),
   async = require('async'),
   _ = require('lodash');

var Saga = function(id) {
  this.id = id;
  this.isInited = false;
  this.uncommittedEvents = [];
  this.attributes = { id: id, destroyed: false };
};

Saga.prototype = {

  set: function(data) {
    if (arguments.length === 2) {
      this.attributes[arguments[0]] = arguments[1];
    } else {
      for(var m in data) {
        this.attributes[m] = data[m];
      }
    }
  },

  get: function(attr) {
    return this.attributes[attr];
  },

  loadData: function(data, version) {
    this.set(data);
  },

  load: function(data, callback) {
    if (data && data.version) {
      var version = data.version;
      delete data.version;
      this.loadData(data, version);
    } else if (data) {
      this.loadData(data);
    }

    var self = this;

    if (this.initialize) {
      this.initialize(function(err) {
        self.isInited = true;
        callback(err);
      });
    } else {
      this.isInited = true;
      callback(null);
    }
  },

  toJSON: function() {
    var clone = _.clone(this.attributes);
    if (this.version !== null && this.version !== undefined) {
      clone.version = this.version;
    }
    return clone;
  },

  sendCommand: function(cmd) {
    if (!cmd.payload) cmd.payload = {};
    if (!cmd.payload.id) cmd.payload.id = this.id;

    if (this.isInited) {
      //emit...
      eventEmitter.emit('command:' + cmd.command, cmd);
    }
  },

  transitionEvent: function(evt, callback) {
    if (evt.head &&
        evt.head.version !== null &&
        evt.head.version !== undefined &&
        this[evt.event + '_' + evt.head.version]) {
      this[evt.event + '_' + evt.head.version](evt.payload, callback);
      return;
    }

    this[evt.event](evt.payload, callback);
  },

  transition: function(events, callback) {
    var self = this;

    if (!_.isArray(events)) {
      events = [events];
    }

    var historyEvents = [];
    var newEvents = [];
    _.each(events, function(evt) {
      if (evt.fromHistory) {
        historyEvents.push(evt);
      } else {
        newEvents.push(evt);
      }
    });

    async.forEach(historyEvents, function(evt, callback) {
      self.transitionEvent(evt, callback);
    }, function(err) {
      async.forEach(newEvents, function(evt, callback) {
        self.transitionEvent(evt, function(err) {
          self.uncommittedEvents.push(evt);
          callback(err);
        });
      }, callback);
    });
  }

};

Saga.extend = utils.extend;

module.exports = Saga;