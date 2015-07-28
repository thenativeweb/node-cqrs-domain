'use strict';

var util = require('util'),
  Bumper = require('../base'),
  _ = require('lodash'),
  tingodb = Bumper.use('tingodb')(),
  ObjectID = tingodb.ObjectID;

function Tingo(options) {
  Bumper.call(this, options);

  var defaults = {
    dbPath: require('path').join(__dirname, '/../../../'),
    collectionName: 'commandbumper',
    ttl:  1000 * 60 * 60 * 1 // 1 hour'
  };

  _.defaults(options, defaults);

  this.options = options;
}

util.inherits(Tingo, Bumper);

_.extend(Tingo.prototype, {

  connect: function (callback) {
    var self = this;

    var options = this.options;

    this.db = new tingodb.Db(options.dbPath, {});
    // this.db.on('close', function() {
    //   self.emit('disconnect');
    // });
    this.bumper = this.db.collection(options.collectionName + '.tingo');
    this.bumper.ensureIndex({ expires: 1 }, { expireAfterSeconds: 0 }, function() {});

    this.emit('connect');
    if (callback) callback(null, this);
  },

  disconnect: function (callback) {
    if (!this.db) {
      if (callback) callback(null);
      return;
    }

    this.emit('disconnect');
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

      // tingodb is not so fast in removing expired documents
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

module.exports = Tingo;
