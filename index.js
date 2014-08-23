'use strict';

var Domain = require('./lib/domain');

function domain (options) {
  return new Domain(options);
}

domain.defineContext = function () { return 'contextContent'; };
domain.defineAggregate = function () { return 'aggregateContent'; };
domain.defineCommand = function () { return 'commandContent'; };

module.exports = domain;
