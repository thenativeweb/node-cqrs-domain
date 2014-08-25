'use strict';

var _ = require('lodash');

function Definition (meta) {
  if (!this.name && meta && meta.name) {
    this.name = meta.name;
  }

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
      aggregateId: 'aggregate.id'
//      context: 'context.name',        // optional
//      aggregate: 'aggregate.name',    // optional
//      payload: 'payload',             // optional
//      revision: 'revision',           // optional
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
  this.definitions.command = _.defaults(definition, this.definitions.command);
};

/**
 * Inject definition for event structure.
 * @param   {Object} definition the definition to be injected
 */
Definition.prototype.defineEvent = function (definition) {
  this.definitions.event = _.defaults(definition, this.definitions.event);
  return this;
};

module.exports = Definition;
