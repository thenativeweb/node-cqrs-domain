var utils = require('../utils')
  , eventEmitter = require('../eventEmitter')
  , _ = require('underscore');

var Saga = function(id) {
    this.id = id;
    this.destroyed = false;
    this.isInited = false;
    this.uncommittedEvents = [];
};

Saga.prototype = {

    loadFromHistory: function(events) {
        if (events) {
            this.transition(_.map(events, function(evt) {
                evt.fromHistory = true;
                return evt;
            }));
        }
    },

    destroy: function() {
        this.destroyed = true;
    },

    sendCommand: function(cmd) {
        if (!cmd.payload) cmd.payload = {};
        if (!cmd.payload.id) cmd.payload.id = this.id;

        if (this.isInited) {
            //emit...
            eventEmitter.emit('command:' + cmd.command, cmd);
        }
    },

    transition: function(events) {
        var self = this;

        if (!_.isArray(events)) {
            events = [events];
        }

        var historyEvents = [];
        var newEvents = [];
        _.each(events, function(evt) {
            if (evt.fromHistory) {
                historyEvents.push(evt);
            } else {
                newEvents.push(evt);
            }
        });

        _.each(historyEvents, function(evt) {
            self[evt.event](evt.payload);
        });

        _.each(newEvents, function(evt) {
            self[evt.event](evt.payload);
            self.uncommittedEvents.push(evt);
        });

        return;
    }

};

Saga.extend = utils.extend;

module.exports = Saga;