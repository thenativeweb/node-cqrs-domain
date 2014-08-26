'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:command');

function Command (meta, cmdFn) {
  Definition.call(this, meta);

  this.version = meta.version || 0;
  this.payload = meta.payload || '';

  this.cmdFn = cmdFn;
}

util.inherits(Command, Definition);

_.extend(Command.prototype, {

  defineValidation: function (validator) {
    this.validator = validator;
  },
  
  validate: function (cmd) {
    return this.validator(cmd);
  },
  
  handle: function (cmd, aggregateModel) {
    if (!this.payload || this.payload === '') {
      this.cmdFn(cmd, aggregateModel);
      return;
    }

    var payload = dotty.get(cmd, this.payload);
    this.cmdFn(payload, aggregateModel);
  }

});

module.exports = Command;
