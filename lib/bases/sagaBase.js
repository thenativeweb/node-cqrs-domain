var utils = require('../utils')
  , eventEmitter = require('../eventEmitter')
  , _ = require('lodash');

var Saga = function(id) {
    this.id = id;
    this.isInited = false;
    this.uncommittedEvents = [];
    this.attributes = { id: id, destroyed: false };
};

Saga.prototype = {

    set: function(data) {
        if (arguments.length === 2) {
            this.attributes[arguments[0]] = arguments[1];
        } else {
            for(var m in data) {
                this.attributes[m] = data[m];
            }
        }
    },

    get: function(attr) {
        return this.attributes[attr];
    },

    load: function(data) {
        if (data) {
            this.set(data);
        }

        if (this.initialize) {
            this.initialize();
        }
        this.isInited = true;
    },

    toJSON: function() {
        return _.clone(this.attributes);
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