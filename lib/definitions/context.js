'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:context'),
  Aggregate = require('./aggregate');

/**
 * Context constructor
 * @param {Object} meta meta infos like: { name: 'name' }
 * @constructor
 */
function Context (meta) {
  Definition.call(this, meta);

  meta = meta || {};

  this.aggregates = [];
}

util.inherits(Context, Definition);

_.extend(Context.prototype, {

  /**
   * Adds an aggregate to this context.
   * @param {Aggregate} aggregate the aggregate that should be added
   */
  addAggregate: function (aggregate) {
    if (!aggregate || !(aggregate instanceof Aggregate)) {
      throw new Error('Passed object should be an Aggregate');
    }

    aggregate.defineContext(this);

    if (this.aggregates.indexOf(aggregate) < 0) {
      this.aggregates.push(aggregate);
    }
  },

  /**
   * Returns the aggregate with the requested name.
   * @param {String} name command name
   * @returns {Aggregate}
   */
  getAggregate: function (name) {
    if (!name || !_.isString(name)) {
      throw new Error('Please pass in an aggregate name!');
    }

    return _.find(this.aggregates, function (agg) {
      return agg.name === name;
    });
  },

  /**
   * Return the aggregate that handles the requested command.
   * @param {String} name    command name
   * @param {Number} version command version
   * @returns {Aggregate}
   */
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

    for (var a in this.aggregates) {
      var aggr = this.aggregates[a];
      var cmdHndl = aggr.getCommandHandler(name, version);
      if (cmdHndl && cmdHndl !== aggr.defaultCommandHandler) {
        return aggr;
      }
    }

    debug('no matching aggregate found for command ' + name);

    return null;
  },

  // /**
  //  * Return the aggregate that handles the requested command.
  //  * @param {Object} query the query object
  //  * @returns {Aggregate}
  //  */
  // getAggregateForCommandByOldTarget: function (query) {
  //   if (!query) {
  //     throw new Error('Please pass in a query object!');
  //   }
  //
  //   for (var a in this.aggregates) {
  //     var aggr = this.aggregates[a];
  //     var cmd = aggr.getCommand(query.name, query.version);
  //     if (cmd && cmd.source && cmd.source.context === query.context && cmd.source.aggregate === query.aggregate) {
  //       return aggr;
  //     }
  //   }
  //
  //   for (var a in this.aggregates) {
  //     var aggr = this.aggregates[a];
  //     var cmdHndl = aggr.getCommandHandler(query.name, query.version);
  //     if (cmdHndl && cmdHndl !== aggr.defaultCommandHandler && cmdHndl.source && cmdHndl.source.context === query.context && cmdHndl.source.aggregate === query.aggregate) {
  //       return aggr;
  //     }
  //   }
  //
  //   debug('no matching aggregate found for command ' + query.name);
  //
  //   return null;
  // },

  /**
   * Return all aggregates.
   * @returns {Array}
   */
  getAggregates: function () {
    return this.aggregates;
  }

});

module.exports = Context;
