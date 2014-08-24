'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:businessRule');

function BusinessRule (meta) {
  Definition.call(this, meta);
}

util.inherits(BusinessRule, Definition);

//_.extend(BusinessRule.prototype, {});

module.exports = BusinessRule;
