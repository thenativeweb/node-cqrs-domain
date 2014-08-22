'use strict';

var Domain = require('./lib/domain');

function domain (options) {
  return new Domain(options);
}

domain.defineCommand = function () {};

module.exports = domain;
