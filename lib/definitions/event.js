'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  dotty = require('dotty'),
  debug = require('debug')('domain:event');

function Event (meta, evtFn) {
  Definition.call(this, meta);

  meta = meta || {};
  
  if (!evtFn || !_.isFunction(evtFn)) {
    var err = new Error('Event function not injected!');
    debug(err);
    throw err;
  }
  
  this.version = meta.version || 0;
  this.payload = meta.payload || '';
  
  this.evtFn = evtFn;
}

util.inherits(Event, Definition);

_.extend(Event.prototype, {
  
  apply: function (evt, aggregateModel) {
    if (!this.payload || this.payload === '') {
      this.evtFn(evt, aggregateModel);
      return;
    }
    
    var payload = dotty.get(evt, this.payload);
    this.evtFn(payload, aggregateModel);
  }
  
});

module.exports = Event;
