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
  this.payload = meta.payload || null;

  this.cmdFn = cmdFn;
}

util.inherits(Command, Definition);

_.extend(Command.prototype, {

  /**
   * Injects the pre-condition function.
   * @param {Function} preCond The pre-condition function that should be injected
   */
  definePreCondition: function (preCond) {
    if (!preCond || !_.isObject(preCond)) {
      var err = new Error('Please inject a valid preCondition object!');
      debug(err);
      throw err;
    }
    this.preCondition = preCond;
  },

  /**
   * Injects the validator function.
   * @param {Function} validator The validator function that should be injected
   */
  defineValidation: function (validator) {
    if (!_.isFunction(validator)) {
      var err = new Error('Please pass in a function');
      debug(err);
      throw err;
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
   * Checks for pre-condition
   * @param {Object}         cmd            The command object.
   * @param {AggregateModel} aggregateModel The aggregate object.
   * @param {Function}       callback       The function, that will be called when this action is completed.
   *                                        `function(err){}`
   */
  checkPreCondition: function (cmd, aggregateModel, callback) {
    if (!this.preCondition) {
      debug('no pre-condition for ' + this.name);
      return callback(null);
    }
    
    this.preCondition.check(cmd, aggregateModel, callback);
  },

  /**
   * Handles the passed command
   * @param {Object}         cmd            The command object.
   * @param {AggregateModel} aggregateModel The aggregate object.
   */
  handle: function (cmd, aggregateModel) {
    if (!this.payload || this.payload === '') {
      this.cmdFn(_.cloneDeep(cmd), aggregateModel);
      return;
    }

    var payload = dotty.get(cmd, this.payload);
    this.cmdFn(_.cloneDeep(payload), aggregateModel);
  }

});

module.exports = Command;
