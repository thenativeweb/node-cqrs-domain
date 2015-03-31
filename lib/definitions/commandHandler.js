'use strict';

var DefaultCommandHandler = require('../defaultCommandHandler'),
  util = require('util'),
  _ = require('lodash'),
  dotty = require('dotty'),
  debug = require('debug')('domain:commandHandler');

/**
 * CommandHandler constructor
 * @param {Object}   meta      Meta infos like: { name: 'name', version: 1 }
 * @param {Function} cmdHndlFn Function handle
 *                             `function(aggId, cmd, commandHandler, callback){}`
 * @constructor
 */
function CommandHandler (meta, cmdHndlFn) {
  DefaultCommandHandler.call(this, meta);

  console.log('Is your use case not solvable without a custom command handling? Sagas? Micro-Services?');

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

  /**
   * Handles the passed command
   * @param {Object}   cmd      The passed command
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, evts){}`
   */
  handle: function (cmd, callback) {
    debug('called a custom command handler');
    console.log('Is your use case not solvable without a custom command handling? Sagas? Micro-Services?');

    var self = this;

    function _handle (aggId) {
      var concatenatedId = self.getConcatenatedId(aggId, cmd);

      var isFirst = !self.getNextCommandInQueue(concatenatedId);

      self.queueCommand(concatenatedId, cmd, callback);

      if (!isFirst) {
        return;
      }

      (function handleNext (aggregateId, c) {
        var concId = self.getConcatenatedId(aggregateId, c);
        var cmdEntry = self.getNextCommandInQueue(concId);
        if (cmdEntry) {
          if (cmdEntry.callback.length > 2) {
            self.cmdHndlFn(aggregateId, cmdEntry.command, self, function (err, evts, aggData, meta) {
              self.removeCommandFromQueue(concId, cmdEntry.command);
              handleNext(aggregateId, cmdEntry.command);
              cmdEntry.callback(err, evts, aggData, meta);
            });
            return;
          }
          self.cmdHndlFn(aggregateId, cmdEntry.command, self, function (err, evts) {
            self.removeCommandFromQueue(concId, cmdEntry.command);
            handleNext(aggregateId, cmdEntry.command);
            cmdEntry.callback(err, evts);
          });
        }
      })(aggId, cmd);
    }

    if (dotty.exists(cmd, this.definitions.command.aggregateId)) {
      return _handle(dotty.get(cmd, this.definitions.command.aggregateId));
    }

    debug('no aggregateId in command, so generate a new one');

    var getNewIdFn = this.aggregate && this.aggregate.getNewAggregateId ? this.aggregate.getNewAggregateId.bind(this.aggregate) : this.eventStore.getNewId.bind(this.eventStore);

    getNewIdFn(function (err, id) {
      if (err) {
        debug(err);
        return callback(err);
      }

      return _handle(id);
    });
  }

});

module.exports = CommandHandler;
