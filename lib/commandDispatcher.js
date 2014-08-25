'use strict';

var debug = require('debug')('domain:commandDispatcher'),
  dotty = require('dotty');

function CommandDispatcher (tree, definition) {
  this.tree = tree;
  this.definition = definition
}

CommandDispatcher.prototype = {
  
  getTargetInformation: function (cmd) {
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
  
  dispatch: function (cmd, callback) {
    var target = this.getTargetInformation(cmd);
    
    var commandHandler = this.tree.getCommandHandler(target);
    
    if (!commandHandler) {
      var err = new Error('no command handler found for ' + target.name);
      debug(err);
      return callback(err);
    }
    
    commandHandler.handle(cmd, callback);
  }
  
};

module.exports = CommandDispatcher;
