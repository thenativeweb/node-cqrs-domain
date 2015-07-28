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
    ttl:  1000 * 60 * 60 * 1 // 1 hour
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

util.inherits(Mongo, Bumper);

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
    });

    this.db.open(function (err, client) {
      if (err) {
        if (callback) callback(err);
      } else {
        var finish = function (err) {
          self.client = client;
          self.bumper = self.db.collection(options.collectionName);
          self.bumper.ensureIndex({ expires: 1 }, { expireAfterSeconds: 0 }, function() {});
          if (!err) {
            self.emit('connect');
          }
          if (callback) callback(err, self);
        };

        if (options.username) {
          client.authenticate(options.username, options.password, finish);
        } else {
          finish();
        }
      }
    });
  },

  disconnect: function (callback) {
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
