'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  dotty = require('dotty'),
  async = require('async'),
  debug = require('debug')('domain:command'),
  BusinessRuleError = require('../errors/businessRuleError');

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
  if (meta.existing) {
    this.existing = true;
  } else if (meta.existing === false) {
    this.existing = false;
  } else {
    this.existing = undefined;
  }

  this.cmdFn = cmdFn;

  this.preConditions = [];
}

util.inherits(Command, Definition);

_.extend(Command.prototype, {

  /**
   * Inject the aggregate module.
   * @param {Aggregate} aggregate The context module to be injected.
   */
  defineAggregate: function (aggregate) {
    if (!aggregate || !_.isObject(aggregate)) {
      var err = new Error('Please inject a valid aggregate object!');
      debug(err);
      throw err;
    }

    this.aggregate = aggregate;
  },

  /**
   * Injects the pre-condition function.
   * @param {Function} preCond The pre-condition function that should be injected
   */
  addPreCondition: function (preCond) {
    if (!preCond || !_.isObject(preCond)) {
      var err = new Error('Please inject a valid preCondition object!');
      debug(err);
      throw err;
    }

    if (!preCond.payload) {
      preCond.payload = this.aggregate.defaultPreConditionPayload;
    }

    if (this.preConditions.indexOf(preCond) < 0) {
      this.preConditions.push(preCond);
      this.preConditions = _.sortBy(this.preConditions, function(pc) {
        return pc.priority;
      });
    }
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
   * Checks for pre-conditions
   * @param {Object}         cmd            The command object.
   * @param {AggregateModel} aggregateModel The aggregate object.
   * @param {Function}       callback       The function, that will be called when this action is completed.
   *                                        `function(err){}`
   */
  checkPreConditions: function (cmd, aggregateModel, callback) {
    if (this.existing === true && aggregateModel.get('_revision') === 0) {
      var err = new BusinessRuleError('This command only wants to be handled, if aggregate already existing!');
      debug(err);
      return callback(err);
    }

    if (this.existing === false && aggregateModel.get('_revision') !== 0) {
      var err = new BusinessRuleError('This command only wants to be handled, if aggregate not existing!');
      debug(err);
      return callback(err);
    }

    if (this.preConditions.length === 0) {
      debug('no pre-condition for ' + this.name);
      return callback(null);
    }

    async.eachSeries(this.preConditions, function (preCondition, callback) {
      preCondition.check(cmd, aggregateModel, callback);
    }, callback);
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
