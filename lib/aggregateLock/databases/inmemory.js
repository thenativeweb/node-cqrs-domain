'use strict';

var util = require('util'),
  Lock = require('../base'),
  _ = require('lodash');

function InMemory(options) {
  Lock.call(this, options);
  this.store = {};
}

util.inherits(InMemory, Lock);

_.extend(InMemory.prototype, {

  connect: function (callback) {
    this.emit('connect');
    if (callback) callback(null, this);
  },

  disconnect: function (callback) {
    this.emit('disconnect');
    if (callback) callback(null);
  },

  reserve: function(workerId, aggregateId, callback) {
    this.store[aggregateId] = this.store[aggregateId] || [];
    this.store[aggregateId].push(workerId);
    if (callback) callback(null);
  },

  getAll: function(aggregateId, callback) {
    if (callback) callback(null, this.store[aggregateId] || []);
  },

  resolve: function(aggregateId, callback) {
    if (this.store[aggregateId] !== undefined) delete this.store[aggregateId];
    if (callback) callback(null);
  },

  clear: function (callback) {
    this.store = {};
    if (callback) callback(null);
  }

});

module.exports = InMemory;
