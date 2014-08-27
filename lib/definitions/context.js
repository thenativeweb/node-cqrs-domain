'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:context'),
  Aggregate = require('./aggregate');

function Context (meta) {
  Definition.call(this, meta);

  meta = meta || {};
  
  this.aggregates = [];
}

util.inherits(Context, Definition);

_.extend(Context.prototype, {
  
  addAggregate: function (aggregate) {
    if (!aggregate || !(aggregate instanceof Aggregate)) {
      throw new Error('Passed object should be an Aggregate');
    }
    
    aggregate.defineContext(this);
    this.aggregates.push(aggregate);
  },

  getAggregate: function (name) {
    if (!name || !_.isString(name)) {
      throw new Error('Please pass in an aggregate name!');
    }
    
    return _.find(this.aggregates, function (agg) {
      return agg.name = name;
    });
  },

  getAggregateForCommand: function (name, version) {
    if (!name || !_.isString(name)) {
      throw new Error('Please pass in a command name!');
    }
    
    for (var a in this.aggregates) {
      var aggr = this.aggregates[a];
      var cmd = aggr.getCommand(name, version);
      if (cmd) {
        return aggr;
      }
    }
  },

  getAggregates: function () {
    return this.aggregates;
  }
  
});

module.exports = Context;
