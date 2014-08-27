'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:businessRule'),
  BusinessRuleError = require('../errors/businessRuleError');

function BusinessRule (meta, businessRuleFn) {
  Definition.call(this, meta);
  
  this.description = meta.description;
  this.priority = meta.priority || Infinity;
  
  this.businessRuleFn = businessRuleFn;
}

util.inherits(BusinessRule, Definition);

_.extend(BusinessRule.prototype, {
  
  check: function (changed, previous, events, command, callback) {
    
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

    try {
      if (this.businessRuleFn.length === 5) {
        this.businessRuleFn(changed, previous, events, command, function (err) {
          handleError(err);
        });
      } else {
        var err = this.businessRuleFn(changed, previous, events, command);
        if (err) {
          handleError(err);
        }
      }
    } catch (err) {
      handleError(err);
    }
  }
  
});

module.exports = BusinessRule;
