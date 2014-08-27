'use strict';

var DefaultCommandHandler = require('../defaultCommandHandler'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:commandHandler');

function CommandHandler (meta, cmdHndlFn) {
  DefaultCommandHandler.call(this, meta);

  meta = meta || {};
  
  this.cmdHndlFn = cmdHndlFn;
}

util.inherits(CommandHandler, DefaultCommandHandler);

_.extend(CommandHandler.prototype, {
  
  handle: function (cmd, callback) {
    var self = this;
    
    DefaultCommandHandler.prototype.handle.call(this, cmd, function (err) {
      if (err) {
        debug(err);
        return callback(err);
      }
      self.cmdHndlFn(cmd, self, callback);
    });
  }
  
});

module.exports = CommandHandler;
