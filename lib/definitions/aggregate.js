'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:aggregate'),
  AggregateModel = require('../aggregateModel'),
  DefaultCommandHandler = require('../defaultCommandHandler');

function Aggregate (meta) {  
  Definition.call(this, meta);
  
  this.version = meta.version || 0;
  
  this.commands = [];
  this.events = [];
  this.businessRules = [];
  this.commandHandlers = [];
  
  this.defaultCommandHandler = new DefaultCommandHandler(this);
}

util.inherits(Aggregate, Definition);

_.extend(Aggregate.prototype, {

  defineContext: function (context) {
    this.context = context;
  },
  
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
    return this.commands;
  },

  getEvents: function () {
    return this.events;
  },

  getBusinessRules: function () {
    return this.businessRules;
  },

  getCommandHandlers: function () {
    return this.commandHandlers;
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
  
  create: function (id) {
    return new AggregateModel(id, this.name, this.version);
  },
  
  validateCommand: function (cmd) {
    
  },
  
  handle: function (cmd, callback) {
    // handle and check business rules
  },

  loadFromHistory: function (aggregateModel, snapshot, events) {
    
  },

  defineSnapshotConversion: function () {
    return this;
  }

});

module.exports = Aggregate;
