'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:event');

function Event (meta) {
  Definition.call(this, meta);
}

util.inherits(Event, Definition);

//_.extend(Event.prototype, {});

module.exports = Event;
