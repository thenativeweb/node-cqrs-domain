'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:context');

function Context (meta) {
  Definition.call(this, meta);
  
  this.aggregates = {};
}

util.inherits(Context, Definition);

_.extend(Context.prototype, {
  
  addAggregate: function (aggregate) {
    this.aggregates[aggregate.name] = aggregate;
  },

  getAggregate: function (name) {
    return this.aggregates[name];
  },

  getAggregates: function () {
    return this.aggregates;
  }
  
});

module.exports = Context;
