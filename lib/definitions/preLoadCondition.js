'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  dotty = require('dotty'),
  debug = require('debug')('domain:preLoadCondition'),
  BusinessRuleError = require('../errors/businessRuleError');

/**
 * PreLoadCondition constructor
 * @param {Object}   meta  Meta infos like: { name: 'name', version: 1, priority: 1, payload: 'some.path', description: 'bla bla' }
 * @param {Function} preLoadConditionFn Function handle
 *                                  `function(command, aggData, callback){}`
 * @constructor
 */
function PreLoadCondition (meta, preLoadConditionFn) {
  Definition.call(this, meta);

  meta = meta || {};

  if (!preLoadConditionFn || !_.isFunction(preLoadConditionFn)) {
    var err = new Error('Pre-load-condition function not injected!');
    debug(err);
    throw err;
  }

  this.description = meta.description;
  this.version = meta.version;
  this.payload = meta.payload || null;
  this.priority = meta.priority || Infinity;

  this.preLoadConditionFn = preLoadConditionFn;
}

util.inherits(PreLoadCondition, Definition);

_.extend(PreLoadCondition.prototype, {

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
   * Checks this business rule.
   * @param {Object}   command  The command that was handled.
   * @param {Object}   aggData  The aggregate values.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err){}`
   */
  check: function (command, callback) {

    var self = this;
    var callbacked = false;

    function handleError (err) {
      debug(err);

      if (_.isString(err)) {
        if (_.isEmpty(err)) {
          err = self.description;
        }
        err = new BusinessRuleError(err);
      } else if (err instanceof BusinessRuleError) {
        // do nothing
      } else {
        err = new BusinessRuleError(err.message || self.description);
      }

      callbacked = true;
      callback(err);
    }

    var payload;
    if (!this.payload || this.payload === '') {
      payload = command;
    } else {
      payload = dotty.get(command, this.payload);
    }

    try {
      if (this.preLoadConditionFn.length === 2) {
        this.preLoadConditionFn(_.cloneDeep(payload), function (err) {
          if (err) {
            return handleError(err);
          }
          callbacked = true;
          callback(null);
        });
      } else {
        var err = this.preLoadConditionFn(_.cloneDeep(payload));
        if (err) {
          return handleError(err);
        }
        callbacked = true;
        callback(null);
      }
    } catch (err) {
      if (!callbacked) {
        return handleError(err);
      }
      throw err;
    }
  }

});

module.exports = PreLoadCondition;
