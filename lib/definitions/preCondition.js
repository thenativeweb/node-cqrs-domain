'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  dotty = require('dotty'),
  debug = require('debug')('domain:preCondition'),
  BusinessRuleError = require('../errors/businessRuleError');

/**
 * PreCondition constructor
 * @param {Object}   meta           Meta infos like: { name: 'name', version: 1, payload: 'some.path', description: 'bla bla' }
 * @param {Function} preConditionFn Function handle
 *                                  `function(command, aggData, callback){}`
 * @constructor
 */
function PreCondition (meta, preConditionFn) {
  Definition.call(this, meta);

  meta = meta || {};

  if (!preConditionFn || !_.isFunction(preConditionFn)) {
    var err = new Error('Pre-condition function not injected!');
    debug(err);
    throw err;
  }

  this.description = meta.description;
  this.version = meta.version || 0;
  this.payload = meta.payload || null;

  this.preConditionFn = preConditionFn;
}

util.inherits(PreCondition, Definition);

_.extend(PreCondition.prototype, {

  /**
   * Checks this business rule.
   * @param {Object}   command  The command that was handled.
   * @param {Object}   aggData  The aggregate values.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err){}`
   */
  check: function (command, aggData, callback) {

    var self = this;

    function handleError (err) {
      debug(err);

      if (_.isString(err)) {
        if (_.isEmpty(err)) {
          err = self.description;
        }
        err = new BusinessRuleError(err);
      } else {
        err = new BusinessRuleError(err.message || self.description);
      }

      callback(err);
    }

    var payload;
    if (!this.payload || this.payload === '') {
      payload = _.cloneDeep(command);
    } else {
      payload = dotty.get(_.cloneDeep(command), this.payload);
    }

    try {
      if (this.preConditionFn.length === 3) {
        this.preConditionFn(payload, aggData, function (err) {
          if (err) {
            return handleError(err);
          }
          callback(null);
        });
      } else {
        var err = this.preConditionFn(payload, aggData);
        if (err) {
          return handleError(err);
        }
        callback(null);
      }
    } catch (err) {
      handleError(err);
    }
  }

});

module.exports = PreCondition;
