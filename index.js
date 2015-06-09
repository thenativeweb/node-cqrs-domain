'use strict';

var Domain = require('./lib/domain'),
  ValidationError = require('./lib/errors/validationError'),
  BusinessRuleError = require('./lib/errors/businessRuleError'),
  AggregateConcurrencyError = require('./lib/errors/aggregateConcurrencyError'),
  AggregateDestroyedError = require('./lib/errors/aggregateDestroyedError'),
  ConcurrencyError = require('./lib/errors/concurrencyError'),
  DuplicateCommandError = require('./lib/errors/duplicateCommandError'),
  _ = require('lodash'),
  fs = require('fs'),
  path = require('path');

function domain (options) {
  return new Domain(options);
}

/**
 * Calls the constructor.
 * @param  {Object} klass Constructor function.
 * @param  {Array}  args  Arguments for the constructor function.
 * @return {Object}       The new object.
 */
function construct(klass, args) {
  function T() {
    klass.apply(this, arguments[0]);
  }
  T.prototype = klass.prototype;
  return new T(args);
}

var files = fs.readdirSync(path.join(__dirname, 'lib/definitions'));

files.forEach(function (file) {
  var name = path.basename(file, '.js');
  var nameCap = name.charAt(0).toUpperCase() + name.slice(1);
  domain['define' + nameCap] = function () {
    return construct(require('./lib/definitions/' + name), _.toArray(arguments));
  };
});

domain.errors = {
  ValidationError: ValidationError,
  BusinessRuleError: BusinessRuleError,
  AggregateConcurrencyError: AggregateConcurrencyError,
  AggregateDestroyedError: AggregateDestroyedError,
  ConcurrencyError: ConcurrencyError,
  DuplicateCommandError: DuplicateCommandError
};

module.exports = domain;
