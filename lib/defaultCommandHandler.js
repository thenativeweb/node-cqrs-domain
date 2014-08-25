'use strict';

var Definition = require('./definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:defaultCommandHandler'),
  dotty = require('dotty');

function DefaultCommandHandler (aggregate) {
  Definition.call(this);
}

util.inherits(DefaultCommandHandler, Definition);

_.extend(DefaultCommandHandler.prototype, {

  handle: function (cmd, callback) {
    if (!dotty.exists(cmd, this.definitions.command.aggregateId)) {
      debug('no aggregateId in command, so generate a new one');
    }
  }
  
});

module.exports = DefaultCommandHandler;
