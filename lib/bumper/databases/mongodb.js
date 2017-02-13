'use strict';

var util = require('util'),
  Bumper = require('../base'),
  _ = require('lodash'),
  mongo = Bumper.use('mongodb'),
  mongoVersion = Bumper.use('mongodb/package.json').version,
  isNew = mongoVersion.indexOf('1.') !== 0,
  ObjectID = isNew ? mongo.ObjectID : mongo.BSONPure.ObjectID;

function Mongo(options) {
  Bumper.call(this, options);

  var defaults = {
    host: 'localhost',
    port: 27017,
    dbName: 'domain',
    collectionName: 'commandbumper',
    // heartbeat: 60 * 1000
    ttl:  1000 * 60 * 60 * 1 // 1 hour
  };

  _.defaults(options, defaults);

  var defaultOpt = {
    ssl: false
  };

  options.options = options.options || {};

  if (isNew) {
    defaultOpt.autoReconnect = false;
    _.defaults(options.options, defaultOpt);
  } else {
    defaultOpt.auto_reconnect = false;
    _.defaults(options.options, defaultOpt);
  }

  this.options = options;
}

util.inherits(Mongo, Bumper);

_.extend(Mongo.prototype, {

  connect: function (callback) {
    var self = this;

    var options = this.options;

    var connectionUrl;

    if (options.url) {
      connectionUrl = options.url;
    } else {
      var members = options.servers
        ? options.servers
        : [{host: options.host, port: options.port}];

      var memberString = _(members).map(function(m) { return m.host + ':' + m.port; });
      var authString = options.username && options.password
        ? options.username + ':' + options.password + '@'
        : '';
      var optionsString = options.authSource
        ? '?authSource=' + options.authSource
        : '';

      connectionUrl = 'mongodb://' + authString + memberString + '/' + options.dbName + optionsString;
    }

    var client = new mongo.MongoClient();

    client.connect(connectionUrl, options.options, function(err, db) {
      if (err) {
        if (callback) callback(err);
      } else {
        self.db = db;

        self.db.on('close', function() {
          self.emit('disconnect');
          self.stopHeartbeat();
        });

        var finish = function (err) {
          self.bumper = self.db.collection(options.collectionName);
          self.bumper.ensureIndex({ expires: 1 }, { expireAfterSeconds: 0 }, function() {});
          if (!err) {
            self.emit('connect');

            if (self.options.heartbeat) {
              self.startHeartbeat();
            }
          }
          if (callback) callback(err, self);
        };

        finish();
      }
    });
  },

  stopHeartbeat: function () {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      delete this.heartbeatInterval;
    }
  },

  startHeartbeat: function () {
    var self = this;

    var gracePeriod = Math.round(this.options.heartbeat / 2);
    this.heartbeatInterval = setInterval(function () {
      var graceTimer = setTimeout(function () {
        if (self.heartbeatInterval) {
          console.error((new Error ('Heartbeat timeouted after ' + gracePeriod + 'ms (mongodb)')).stack);
          self.disconnect();
        }
      }, gracePeriod);

      self.db.command({ ping: 1 }, function (err) {
        if (graceTimer) clearTimeout(graceTimer);
        if (err) {
          console.error(err.stack || err);
          self.disconnect();
        }
      });
    }, this.options.heartbeat);
  },

  disconnect: function (callback) {
    this.stopHeartbeat();

    if (!this.db) {
      if (callback) callback(null);
      return;
    }

    this.db.close(callback || function () {});
  },

  getNewId: function(callback) {
    callback(null, new ObjectID().toString());
  },

  add: function(key, ttl, callback) {
    if (!callback) {
      callback = ttl;
      ttl = this.options.ttl;
    }

    var self = this;
    var exp = new Date(Date.now() + ttl);
    this.bumper.insert({ _id: key, expires: exp }, { safe: true }, function(err) {
      if (err && err.message && err.message.indexOf('duplicate key') >= 0) {
        return callback(null, false);
      }
      if (err) {
        return callback(err);
      }

      // mongodb is not so fast in removing expired documents
      setTimeout(function () {
        self.bumper.remove({ _id: key }, { safe: true }, function () {});
      }, ttl);

      return callback(null, true);
    });
  },

  clear: function (callback) {
    this.bumper.remove({}, { safe: true }, callback);
  }

});

module.exports = Mongo;
