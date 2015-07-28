'use strict';

var util = require('util'),
  Lock = require('../base'),
  _ = require('lodash'),
  async = require('async'),
  cradle = Lock.use('cradle');

function Couch(options) {
  Lock.call(this, options);

  var defaults = {
    host: 'http://localhost',
    port: 5984,
    dbName: 'domain',
    collectionName: 'aggregatelock'
  };

  _.defaults(options, defaults);

  var defaultOpt = {
    cache: true,
    raw: false,
    forceSave: true//,
    // secure: true,
    // auth: { username: 'login', password: 'pwd' }
  };

  options.options = options.options || {};

  _.defaults(options.options, defaultOpt);

  this.options = options;

  this.collectionName = options.collectionName;
}

util.inherits(Couch, Lock);

_.extend(Couch.prototype, {

  connect: function (callback) {
    var self = this;

    var options = this.options;

    var client = new (cradle.Connection)(options.host, options.port, options.options);
    var db = client.database(options.dbName);
    db.exists(function (err, exists) {

      function finish() {
        self.client = client;
        self.db = db;

        db.get('_design/aggregatelock', function (err, obj) {

          var view = {
            views: {
              findAll: {
                map: function (doc) {
                  emit(doc.collectionName, doc);
                }
              },
              findByAggregateId: {
                map: function (doc) {
                  emit({ collectionName: doc.collectionName, aggregateId: doc.aggregateId}, doc);
                }
              }
            }
          };

          if (err && err.error === 'not_found') {
            db.save('_design/aggregatelock', view, function (err) {
              if (!err) {
                self.emit('connect');
              }
              if (callback) callback(err, self);
            });
            return;
          }
          if (!err) {
            self.emit('connect');
          }
          if (callback) callback(err, self);
        });
      }

      if (err) {
        if (callback) callback(err);
        return;
      }

      if (!exists) {
        db.create(function (err) {
          if (err) {
            if (callback) callback(err);
            return;
          }
          finish();
        });
        return;
      }

      finish();
    });
  },

  disconnect: function(callback) {
    if (!this.client) {
      if (callback) callback(null);
      return;
    }

    // this.client.close();
    this.emit('disconnect');
    if (callback) callback(null);
  },

  getNewId: function(callback) {
    this.client.uuids(function(err, uuids) {
      if (err) {
        return callback(err);
      }
      callback(null, uuids[0].toString());
    });
  },

  reserve: function(workerId, aggregateId, callback) {
    this.db.save(workerId, { _id: workerId, aggregateId: aggregateId, collectionName: this.collectionName }, function (err) {
      if (callback) callback(err);
    });
  },

  getAll: function(aggregateId, callback) {
    this.db.view('aggregatelock/findByAggregateId', { key: { collectionName: this.collectionName, aggregateId: aggregateId } }, function (err, docs) {
      var res = [];

      if (!docs || docs.length === 0) {
        return callback(null, res);
      }

      for (var i = 0, len = docs.length; i < len; i++) {
        var id = docs[i].value._id;
        var found = _.find(res, function (r) {
          return r === id;
        });

        if (!found) {
          res.push(id);
        }
      }

      if (callback) callback(err, res);
    });
  },

  resolve: function(aggregateId, callback) {
    var self = this;

    this.db.view('aggregatelock/findByAggregateId', { key: { collectionName: this.collectionName, aggregateId: aggregateId } }, function (err, res) {
      if (err) {
        return callback(err);
      }

      async.each(res, function (r, callback) {
        self.db.remove(r._id, r._rev, callback);
      }, function (err) {
        if (callback) callback(err);
      });

    });
  },

  clear: function (callback) {
    var self = this;

    this.db.view('aggregatelock/findAll', { key: this.collectionName }, function (err, res) {
      if (err) {
        return callback(err);
      }

      async.each(res, function (r, callback) {
        self.db.remove(r._id, r._rev, callback);
      }, callback || function () {});

    });
  }

});

module.exports = Couch;
