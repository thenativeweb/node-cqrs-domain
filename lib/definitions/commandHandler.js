'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:commandHandler');

function CommandHandler (meta) {
  Definition.call(this, meta);
}

util.inherits(CommandHandler, Definition);

//_.extend(CommandHandler.prototype, {});

module.exports = CommandHandler;
