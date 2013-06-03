var utils = require('../utils')
  , eventEmitter = require('../eventEmitter')
  , async = require('async')
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

    load: function(data, callback) {
        if (data) {
            this.set(data);
        }

        var self = this;

        if (this.initialize) {
            this.initialize(function(err) {
                self.isInited = true;
                callback(err);
            });
        } else {
            this.isInited = true;
            callback(null);
        }
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

    transition: function(events, callback) {
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

        async.forEach(historyEvents, function(evt, callback) {
            self[evt.event](evt.payload, callback);
        }, function(err) {
            async.forEach(newEvents, function(evt, callback) {
                self[evt.event](evt.payload, function(err) {
                    self.uncommittedEvents.push(evt);
                    callback(err);
                });
            }, callback);
        });
    }

};

Saga.extend = utils.extend;

module.exports = Saga;