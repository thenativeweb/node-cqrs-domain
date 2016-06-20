'use strict';

var util = require('util'),
  Bumper = require('../base'),
  _ = require('lodash'),
  async = require('async'),
  redis = Bumper.use('redis');

function Redis(options) {
  Bumper.call(this, options);

  var defaults = {
    host: 'localhost',
    port: 6379,
    prefix: 'commandbumper',
    max_attempts: 1,
    retry_strategy: function (options) {
      return undefined;
    },
    ttl:  1000 * 60 * 60 * 1 // 1 hour,
    // heartbeat: 60 * 1000
  };

  _.defaults(options, defaults);

  if (options.url) {
    var url = require('url').parse(options.url);
    if (url.protocol === 'redis:') {
      if (url.auth) {
        var userparts = url.auth.split(':');
        options.user = userparts[0];
        if (userparts.length === 2) {
          options.password = userparts[1];
        }
      }
      options.host = url.hostname;
      options.port = url.port;
      if (url.pathname) {
        options.db = url.pathname.replace('/', '', 1);
      }
    }
  }

  this.options = options;
}

util.inherits(Redis, Bumper);

_.extend(Redis.prototype, {

  connect: function (callback) {
    var self = this;

    var options = this.options;

    this.client = new redis.createClient(options.port || options.socket, options.host, _.omit(options, 'prefix'));

    this.prefix = options.prefix;

    var calledBack = false;

    if (options.password) {
      this.client.auth(options.password, function(err) {
        if (err && !calledBack && callback) {
          calledBack = true;
          if (callback) callback(err, self);
          return;
        }
        if (err) throw err;
      });
    }

    if (options.db) {
      this.client.select(options.db);
    }

    this.client.on('end', function () {
      self.disconnect();
      self.stopHeartbeat();
    });

    this.client.on('error', function (err) {
      console.log(err);

      if (calledBack) return;
      calledBack = true;
      if (callback) callback(null, self);
    });

    this.client.on('connect', function () {
      if (options.db) {
        self.client.send_anyways = true;
        self.client.select(options.db);
        self.client.send_anyways = false;
      }

      self.emit('connect');

      if (self.options.heartbeat) {
        self.startHeartbeat();
      }

      if (calledBack) return;
      calledBack = true;
      if (callback) callback(null, self);
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
          console.error((new Error ('Heartbeat timeouted after ' + gracePeriod + 'ms (redis)')).stack);
          self.disconnect();
        }
      }, gracePeriod);

      self.client.ping(function (err) {
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

    if (this.client) {
      this.client.end(true);
    }
    this.emit('disconnect');
    if (callback) callback(null, this);
  },

  getNewId: function(callback) {
    this.client.incr('nextItemId:' + this.prefix, function(err, id) {
      if (err) {
        return callback(err);
      }
      callback(null, id.toString());
    });
  },

  add: function(key, ttl, callback) {
    if (!callback) {
      callback = ttl;
      ttl = this.options.ttl;
    }

    var self = this;
    ttl = Math.round(ttl / 1000);
    if (ttl < 1) {
      ttl = 1;
    }
    this.client.setnx(self.options.prefix + ':' + key, ttl, function (err, res) {
      if (err) {
        return callback(err);
      }

      if (!res) {
        return callback(null, false);
      }

      self.client.expire(self.options.prefix + ':' + key, ttl, function (err) {
        if (err) {
          return callback(err);
        }

        callback(null, true);
      });
    });
  },

  clear: function (callback) {
    var self = this;
    async.parallel([
      function (callback) {
        self.client.del('nextItemId:' + self.options.prefix, callback);
      },
      function (callback) {
        self.client.keys(self.options.prefix + ':*', function(err, keys) {
          if (err) {
            return callback(err);
          }
          async.each(keys, function (key, callback) {
            self.client.del(key, callback);
          }, callback);
        });
      }
    ], function (err) {
      if (callback) callback(err);
    });
  }

});

module.exports = Redis;
