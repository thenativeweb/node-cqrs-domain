'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:aggregate');

function Aggregate (meta) {
  this.name = meta.name;

  if (!this.name) {
    var index = __dirname.lastIndexOf(path.sep);
    this.name = __dirname.substring(0, index);
  }
  
  Definition.call(this, meta);
  
  this.commands = [];
  this.events = [];
  this.businessRules = [];
  this.commandHandlers = [];
}

util.inherits(Aggregate, Definition);

_.extend(Aggregate.prototype, {
  
  addCommand: function (command) {
    this.commands.push(command);
  },

  addEvent: function (event) {
    this.events.push(event);
  },

  addBusinessRule: function (businessRule) {
    this.businessRules.push(businessRule);
  },

  addCommandHandler: function (commandHandler) {
    this.commandHandlers.push(commandHandler);
  },

  getCommands: function () {
    return this.commands;
  },

  defineSnapshotConversion: function () {
    return this;
  }

});

module.exports = Aggregate;
