'use strict';

var util = require('util'),
  Lock = require('../base'),
  _ = require('lodash'),
  mongo = Lock.use('mongodb'),
  mongoVersion = Lock.use('mongodb/package.json').version,
  isNew = mongoVersion.indexOf('1.') !== 0,
  ObjectID = isNew ? mongo.ObjectID : mongo.BSONPure.ObjectID;

function Mongo(options) {
  Lock.call(this, options);

  var defaults = {
    host: 'localhost',
    port: 27017,
    dbName: 'domain',
    collectionName: 'aggregatelock'//,
    // heartbeat: 60 * 1000
  };

  _.defaults(options, defaults);

  var defaultOpt = {
    auto_reconnect: false,
    ssl: false
  };

  options.options = options.options || {};

  _.defaults(options.options, defaultOpt);

  this.options = options;
}

util.inherits(Mongo, Lock);

_.extend(Mongo.prototype, {

  connect: function (callback) {
    var self = this;

    var options = this.options;

    var server;

    if (options.servers && Array.isArray(options.servers)){
      var servers = [];

      options.servers.forEach(function(item){
        if(item.host && item.port) {
          servers.push(new mongo.Server(item.host, item.port, item.options));
        }
      });

      server = new mongo.ReplSet(servers);
    } else {
      server = new mongo.Server(options.host, options.port, options.options);
    }

    this.db = new mongo.Db(options.dbName, server, { safe: true });
    this.db.on('close', function() {
      self.emit('disconnect');
      self.stopHeartbeat();
    });

    this.db.open(function (err, client) {
      if (err) {
        if (callback) callback(err);
      } else {
        var finish = function (err) {
          self.client = client;
          self.lock = self.db.collection(options.collectionName);
          self.lock.ensureIndex({ 'aggregateId': 1, date: 1 }, function() {});
          if (!err) {
            self.emit('connect');

            if (self.options.heartbeat) {
              self.startHeartbeat();
            }
          }
          if (callback) callback(err, self);
        };

        if (options.authSource && options.username) {
          // Authenticate with authSource
          client.authenticate(options.username, options.password, {authSource: options.authSource}, finish);
        } else if (options.username) {
          client.authenticate(options.username, options.password, finish);
        } else {
          finish();
        }
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
          self.db.close(function () {});
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

  reserve: function(workerId, aggregateId, callback) {
    this.lock.save({ _id: workerId, aggregateId: aggregateId, date: new Date() }, { safe: true }, function (err) {
      if (callback) callback(err);
    });
  },

  getAll: function(aggregateId, callback) {
    this.lock.find({ aggregateId: aggregateId }, { sort: { date: 1 } }).toArray(function (err, res) {
      if (err) {
        return callback(err);
      }
      callback(null, _.map(res, function (entry) { return entry._id; }));
    });
  },

  resolve: function(aggregateId, callback) {
    this.lock.remove({ aggregateId: aggregateId }, { safe: true }, function (err) {
      if (callback) callback(err);
    });
  },

  clear: function (callback) {
    this.lock.remove({}, { safe: true }, callback);
  }

});

module.exports = Mongo;
