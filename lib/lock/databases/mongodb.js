'use strict';

var util = require('util'),
  Lock = require('../base'),
  _ = require('lodash'),
  mongo = require('mongodb'),
  mongoVersion = require('mongodb/package.json').version,
  isNew = mongoVersion.indexOf('1.') !== 0,
  ObjectID = isNew ? mongo.ObjectID : mongo.BSONPure.ObjectID;

function Mongo(options) {
  Lock.call(this, options);
  
  var defaults = {
    host: 'localhost',
    port: 27017,
    dbName: 'domain',
    collectionName: 'aggregatelock'
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
