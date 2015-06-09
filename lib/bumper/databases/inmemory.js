'use strict';

var util = require('util'),
  Bumper = require('../base'),
  _ = require('lodash');

function InMemory(options) {
  Bumper.call(this, options);
  this.store = [];
  this.options = options;
  this.options.ttl = 1000 * 60 * 60 * 1; // 1 hour
}

util.inherits(InMemory, Bumper);

_.extend(InMemory.prototype, {

  connect: function (callback) {
    this.emit('connect');
    if (callback) callback(null, this);
  },

  disconnect: function (callback) {
    this.emit('disconnect');
    if (callback) callback(null);
  },

  add: function(key, ttl, callback) {
    if (!callback) {
      callback = ttl;
      ttl = this.options.ttl;
    }

    if (this.store.indexOf(key) >= 0) {
      return callback(null, false);
    }

    this.store.push(key);

    var self = this;
    setTimeout(function () {
      self.store = _.remove(self.store, key);
    }, ttl);

    if (callback) callback(null, true);
  },

  clear: function (callback) {
    this.store = [];
    if (callback) callback(null);
  }

});

module.exports = InMemory;
