'use strict';

var Domain = require('./lib/domain');

function domain (options) {
  return new Domain(options);
}

domain.defineContext = function () { return 'context'; };
domain.defineAggregate = function () { return 'aggregate'; };
domain.defineCommand = function () { return 'command'; };

module.exports = domain;
