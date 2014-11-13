'use strict';

var _ = require('lodash');

/**
 * Definition constructor
 * @param {Object} meta meta infos like: { name: 'name' }
 * @constructor
 */
function Definition (meta) {
  if (!this.name && meta) {
    this.name = meta.name;
  }

  this.options = {};

  this.definitions = {
    command: {
      id: 'id',
      name: 'name',
      aggregateId: 'aggregate.id'
//      context: 'context.name',        // optional
//      aggregate: 'aggregate.name',    // optional
//      payload: 'payload',             // optional
//      revision: 'revision',           // optional
//      version: 'version',             // optional
//      meta: 'meta'                    // optional (will be passed directly to corresponding event(s))
    },
    event: {
      correlationId: 'correlationId',
      id: 'id',
      name: 'name',
      aggregateId: 'aggregate.id',
//      context: 'context.name',        // optional
//      aggregate: 'aggregate.name',    // optional
      payload: 'payload',               // optional
      revision: 'revision'              // optional
//      version: 'version',             // optional
//      meta: 'meta'                    // optional (will be passed directly from corresponding command)
    }
  };
}

/**
 * Inject definition for command structure.
 * @param   {Object} definition the definition to be injected
 */
Definition.prototype.defineCommand = function (definition) {
  if (!_.isObject(definition)) {
    throw new Error('Please pass in an object');
  }
  this.definitions.command = _.defaults(definition, this.definitions.command);
};

/**
 * Inject definition for event structure.
 * @param   {Object} definition the definition to be injected
 */
Definition.prototype.defineEvent = function (definition) {
  if (!_.isObject(definition)) {
    throw new Error('Please pass in an object');
  }
  this.definitions.event = _.defaults(definition, this.definitions.event);
  return this;
};

/**
 * Inject options.
 * @param   {Object} options the options to be injected
 */
Definition.prototype.defineOptions = function (options) {
  if (!_.isObject(options)) {
    throw new Error('Please pass in an object');
  }
  this.options = options;
  return this;
};

module.exports = Definition;
