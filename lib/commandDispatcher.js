'use strict';

var debug = require('debug')('domain:commandDispatcher'),
  ValidationError = require('./errors/validationError'),
  _ = require('lodash'),
  dotty = require('dotty');

/**
 * CommandDispatcher constructor
 * @param {Object} tree       The tree object.
 * @param {Object} definition The definition object.
 * @constructor
 */
function CommandDispatcher (tree, definition) {
  if (!tree || !_.isObject(tree) || !_.isFunction(tree.getCommandHandler)) {
    var err = new Error('Please pass a valid tree!');
    debug(err);
    throw err;
  }

  if (!definition || !_.isObject(definition)) {
    var err = new Error('Please pass a valid command definition!');
    debug(err);
    throw err;
  }
  
  this.tree = tree;
  this.definition = definition;
}

CommandDispatcher.prototype = {

  /**
   * Returns the target information of this command.
   * @param {Object} cmd The passed command.
   * @returns {{name: 'commandName', aggregateId: 'aggregateId', version: 0, aggregate: 'aggregateName', context: 'contextName'}}
   */
  getTargetInformation: function (cmd) {
    if (!cmd || !_.isObject(cmd)) {
      var err = new Error('Please pass a valid command!');
      debug(err);
      throw err;
    }
    
    var aggregateId = null;
    if (dotty.exists(cmd, this.definition.aggregateId)) {
      aggregateId = dotty.get(cmd, this.definition.aggregateId);
    } else {
      debug('no aggregateId found, seams to be for a new aggregate');
    }

    var name = dotty.get(cmd, this.definition.name);

    var version = 0;
    if (dotty.exists(cmd, this.definition.version)) {
      version = dotty.get(cmd, this.definition.version);
    } else {
      debug('no version found, handling as version: 0');
    }

    var aggregate = null;
    if (dotty.exists(cmd, this.definition.aggregate)) {
      aggregate = dotty.get(cmd, this.definition.aggregate);
    } else {
      debug('no aggregate found, will lookup in all aggregates');
    }

    var context = null;
    if (dotty.exists(cmd, this.definition.context)) {
      context = dotty.get(cmd, this.definition.context);
    } else {
      debug('no aggregateName found, will lookup in all contexts');
    }
    
    return {
      name: name,
      aggregateId: aggregateId,
      version: version,
      aggregate: aggregate,
      context: context
    };
  },

  /**
   * Dispatches a command.
   * @param {Object}   cmd      The passed command.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, evts){}`
   */
  dispatch: function (cmd, callback) {
    if (!cmd || !_.isObject(cmd)) {
      var err = new Error('Please pass a valid command!');
      debug(err);
      throw err;
    }

    if (!callback || !_.isFunction(callback)) {
      var err = new Error('Please pass a valid callback!');
      debug(err);
      throw err;
    }
    
    var target = this.getTargetInformation(cmd);

    if (!target.name) {
      var err = new ValidationError('No command name given');
      debug(err);
      return callback(err);
    }
    
    var commandHandler = this.tree.getCommandHandler(target);
    
    if (!commandHandler) {
      var err = new Error('No command handler found for ' + target.name);
      debug(err);
      return callback(err);
    }
    
    commandHandler.handle(cmd, callback);
  }
  
};

module.exports = CommandDispatcher;
