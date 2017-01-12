'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  dotty = require('dotty'),
  debug = require('debug')('domain:event');

/**
 * Event constructor
 * @param {Object}   meta  Meta infos like: { name: 'name', version: 1, payload: 'some.path' }
 * @param {Function} evtFn Fuction handle
 *                         `function(evtData, aggregateModel){}`
 * @constructor
 */
function Event (meta, evtFn) {
  Definition.call(this, meta);

  meta = meta || {};

  if (evtFn && !_.isFunction(evtFn)) {
    var err = new Error('Event function not injected!');
    debug(err);
    throw err;
  }

  this.version = meta.version || 0;
  this.payload = meta.payload === '' ? meta.payload : (meta.payload || null);

  this.evtFn = evtFn;
}

util.inherits(Event, Definition);

_.extend(Event.prototype, {

  /**
   * Apply an event.
   * @param {Object}         evt            The event object.
   * @param {AggregateModel} aggregateModel The aggregate object.
   */
  apply: function (evt, aggregateModel) {
    if (!this.evtFn) {
      return;
    }

    if (!this.payload || this.payload === '') {
      this.evtFn(evt, aggregateModel);
      return;
    }

    var payload = dotty.get(evt, this.payload);
    this.evtFn(payload, aggregateModel);
  }

});

module.exports = Event;
