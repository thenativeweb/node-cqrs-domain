'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:context');

function Context (meta) {
  Definition.call(this, meta);
  
  this.aggregates = [];
}

util.inherits(Context, Definition);

_.extend(Context.prototype, {
  
  addAggregate: function (aggregate) {
    aggregate.defineContext(this);
    this.aggregates.push(aggregate);
  },

  getAggregate: function (name) {
    return _.find(this.aggregates, function (agg) {
      return agg.name = name;
    });
  },

  getAggregateForCommand: function (name, version) {
    for (var a in this.aggregates) {
      var aggr = this.aggregates[a];
      var cmd = aggr.getCommand(name, version);
      if (cmd) {
        return aggr;
      }
    }
  },

  getAggregates: function () {
    this.aggregates;
  }
  
});

module.exports = Context;
