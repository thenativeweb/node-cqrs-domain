'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:aggregate'),
  DefaultCommandHandler = require('../defaultCommandHandler');

function Aggregate (meta) {  
  Definition.call(this, meta);
  
  this.commands = [];
  this.events = [];
  this.businessRules = [];
  this.commandHandlers = [];
  
  this.defaultCommandHandler = new DefaultCommandHandler(this);
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

  getCommandsByName: function (name) {
    return _.filter(this.commands, function (cmd) {
      return cmd.name === name;
    });
  },

  getCommand: function (name, version) {
    version = version || 0;
    return _.find(this.commands, function (cmd) {
      return cmd.name === name && cmd.version === version;
    });
  },

  getCommands: function () {
    this.commands;
  },

  getEvents: function () {
    this.events;
  },

  getBusinessRules: function () {
    this.businessRules;
  },

  getCommandHandlers: function () {
    this.commandHandlers;
  },
  
  getCommandHandler: function (name, version) {
    version = version || 0;
    var handler =  _.find(this.commandHandlers, function (cmdHnd) {
      return cmdHnd.name === name && cmdHnd.version === version;
    });
    
    if (handler) {
      return handler;
    }
    
    return defaultCommandHandler;
  },

  defineSnapshotConversion: function () {
    return this;
  }

});

module.exports = Aggregate;
