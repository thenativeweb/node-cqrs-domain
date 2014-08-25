'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:commandHandler'),
  uuid = require('node-uuid').v4;

function CommandHandler (meta) {
  Definition.call(this, meta);
  this.id = uuid().toString();
}

util.inherits(CommandHandler, Definition);

_.extend(CommandHandler.prototype, {

  useEventStore: function (eventStore) {
    this.eventStore = eventStore;
  },

  useAggregateLock: function (aggregateLock) {
    this.aggregateLock = aggregateLock;
  }
  
});

module.exports = CommandHandler;
