'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  dotty = require('dotty'),
  debug = require('debug')('domain:command');

/**
 * Command constructor
 * @param {Object}   meta  Meta infos like: { name: 'name', version: 1, payload: 'some.path' }
 * @param {Function} cmdFn Function handle
 *                         `function(cmd, aggregateModel){}`
 * @constructor
 */
function Command (meta, cmdFn) {
  Definition.call(this, meta);

  meta = meta || {};

  if (!cmdFn || !_.isFunction(cmdFn)) {
    var err = new Error('Command function not injected!');
    debug(err);
    throw err;
  }

  this.version = meta.version || 0;
  this.payload = meta.payload || '';

  this.cmdFn = cmdFn;
}

util.inherits(Command, Definition);

_.extend(Command.prototype, {

  /**
   * Injects the validator function.
   * @param {Function} validator The validator function that should be injected
   */
  defineValidation: function (validator) {
    if (!_.isFunction(validator)) {
      throw new Error('Please pass in a function');
    }
    this.validator = validator;
  },

  /**
   * Validates the requested command.
   * @param {Object} cmd The command object
   * @returns {ValidationError}
   */
  validate: function (cmd) {
    if (!this.validator) {
      debug('no validation rule for ' + this.name);
      return;
    }
    return this.validator(cmd);
  },

  /**
   * Handles the passed command
   * @param {Object}         cmd            The command object.
   * @param {AggregateModel} aggregateModel The aggregate object.
   */
  handle: function (cmd, aggregateModel) {
    if (!this.payload || this.payload === '') {
      this.cmdFn(cmd, aggregateModel);
      return;
    }

    var payload = dotty.get(cmd, this.payload);
    this.cmdFn(payload, aggregateModel);
  }

});

module.exports = Command;
