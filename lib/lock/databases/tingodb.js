'use strict';

var util = require('util'),
  Lock = require('../base'),
  _ = require('lodash'),
  tingodb = Lock.use('tingodb')(),
  ObjectID = tingodb.ObjectID;

function Tingo(options) {
  Lock.call(this, options);

  var defaults = {
    dbPath: require('path').join(__dirname, '/../../../'),
    collectionName: 'aggregatelock'
  };

  _.defaults(options, defaults);

  this.options = options;
}

util.inherits(Tingo, Lock);

_.extend(Tingo.prototype, {

  connect: function (callback) {
    var self = this;

    var options = this.options;

    this.db = new tingodb.Db(options.dbPath, {});
    // this.db.on('close', function() {
    //   self.emit('disconnect');
    // });
    this.lock = this.db.collection(options.collectionName + '.tingo');
    this.lock.ensureIndex({ 'aggregateId': 1, date: 1 }, function() {});

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

module.exports = Tingo;
