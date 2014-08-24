'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:context');

function Context (meta) {
  this.name = meta.name;

  if (!this.name) {
    var index = __dirname.lastIndexOf(path.sep);
    this.name = __dirname.substring(0, index);
  }
  
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
