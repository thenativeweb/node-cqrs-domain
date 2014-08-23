'use strict';

var Domain = require('./lib/domain');

function domain (options) {
  return new Domain(options);
}

domain.defineContext = function (meta) {
  meta.type = 'context';
  return meta;
};
domain.defineAggregate = function (meta) {
  meta.type = 'aggregate';
  return meta;
};
domain.defineCommand = function (meta) {
  meta.type = 'command';
  return meta;
};
domain.defineEvent = function (meta) {
  meta.type = 'event';
  return meta;
};
domain.defineBusinessRule = function (meta) {
  meta.type = 'businessRule';
  return meta;
};
domain.defineCommandHandler = function (meta) {
  meta.type = 'commandHandler';
  return meta;
};

module.exports = domain;
