'use strict';

var DefaultCommandHandler = require('../defaultCommandHandler'),
  util = require('util'),
  _ = require('lodash'),
  dotty = require('dotty'),
  debug = require('debug')('domain:commandHandler');

function CommandHandler (meta, cmdHndlFn) {
  DefaultCommandHandler.call(this, meta);

  meta = meta || {};
  
  this.version = meta.version || 0;

  if (!cmdHndlFn || !_.isFunction(cmdHndlFn)) {
    var err = new Error('CommandHandler function not injected!');
    debug(err);
    throw err;
  }
  
  this.cmdHndlFn = cmdHndlFn;
}

util.inherits(CommandHandler, DefaultCommandHandler);

_.extend(CommandHandler.prototype, {
  
  handle: function (cmd, callback) {
    var self = this;

    function _handle () {
      self.queueCommand(cmd, callback);

      (function handleNext(nextCommand) {
        var cmdEntry = self.getNextCommandInQueue(nextCommand);
        if (cmdEntry) {
          self.cmdHndlFn(cmdEntry.command, self, function (err, evts) {
            self.dequeueCommand(cmdEntry.command);
            handleNext(cmdEntry.command);
            cmdEntry.callback(err, evts);
          });
        }
      })(cmd);
    }

    if (dotty.exists(cmd, this.definitions.command.aggregateId)) {
      return _handle();
    }

    debug('no aggregateId in command, so generate a new one');

    this.eventStore.getNewId(function (err, id) {
      if (err) {
        debug(err);
        return callback(err);
      }

      dotty.put(cmd, self.definitions.command.aggregateId, id);
      return _handle();
    });
  }
  
});

module.exports = CommandHandler;
