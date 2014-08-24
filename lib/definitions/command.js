'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:command');

function Command (meta) {
  Definition.call(this, meta);
}

util.inherits(Command, Definition);

_.extend(Command.prototype, {
  
  defineSchema: function (schema) {
    this.schema = schema;
  }

});

module.exports = Command;
