'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:businessRule'),
  BusinessRuleError = require('../errors/businessRuleError');

/**
 * BusinessRule constructor
 * @param {Object}   meta           Meta infos like: { name: 'name', priority: 1, description: 'bla bla' }
 * @param {Function} businessRuleFn Function handle
 *                                  `function(changed, previous, events, command, callback){}`
 * @constructor
 */
function BusinessRule (meta, businessRuleFn) {
  Definition.call(this, meta);

  meta = meta || {};

  if (!businessRuleFn || !_.isFunction(businessRuleFn)) {
    var err = new Error('Business rule function not injected!');
    debug(err);
    throw err;
  }

  this.description = meta.description;
  this.priority = meta.priority || Infinity;

  this.businessRuleFn = businessRuleFn;
}

util.inherits(BusinessRule, Definition);

_.extend(BusinessRule.prototype, {

  /**
   * Checks this business rule.
   * @param {Object}   changed  The new aggregate values.
   * @param {Object}   previous The previous aggregate values.
   * @param {Array}    events   All new generated events.
   * @param {Object}   command  The command that was handled.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err){}`
   */
  check: function (changed, previous, events, command, callback) {

    var self = this;
    var callbacked = false;

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

      callbacked = true;
      callback(err);
    }

    try {
      if (this.businessRuleFn.length === 5) {
        this.businessRuleFn(changed, previous, events, command, function (err) {
          if (err) {
            return handleError(err);
          }
          callbacked = true;
          callback(null);
        });
      } else {
        var err = this.businessRuleFn(changed, previous, events, command);
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

module.exports = BusinessRule;
