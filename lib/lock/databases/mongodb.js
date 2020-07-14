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
    ssl: false
  };

  options.options = options.options || {};

  if (isNew) {
    defaultOpt.autoReconnect = false;
    defaultOpt.useNewUrlParser = true;
    defaultOpt.useUnifiedTopology = true;
    _.defaults(options.options, defaultOpt);
  } else {
    defaultOpt.auto_reconnect = false;
    _.defaults(options.options, defaultOpt);
  }

  this.options = options;
}

util.inherits(Mongo, Lock);

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

    var client;

    if (mongo.MongoClient.length === 2) {
      client = new mongo.MongoClient(connectionUrl, options.options);
      client.connect(function(err, cl) {
        if (err) {
          debug(err);
          if (callback) callback(err);
          return;
        }

        self.db = cl.db(cl.s.options.dbName);
        if (!self.db.close) {
          self.db.close = cl.close.bind(cl);
        }
        initDb();
      });
    } else {
      client = new mongo.MongoClient();
      client.connect(connectionUrl, options.options, function(err, db) {
        if (err) {
          debug(err);
          if (callback) callback(err);
          return;
        }

        self.db = db;
        initDb();
      });
    }

    function initDb() {
      self.db.on('close', function() {
        self.emit('disconnect');
        self.stopHeartbeat();
      });

      var finish = function (err) {
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

      finish();
    }
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
