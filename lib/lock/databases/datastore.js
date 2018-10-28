var util = require('util'),
  Lock = require('../base'),
  _ = require('lodash'),
  async = require('async'),
  DS = require('@google-cloud/datastore');

function Datastore(options) {
  options = options || {};

  var dsConf = {
    projectId: ""
  };

  this.options = _.defaults(options, dsConf);

  var defaults = {
    lockTableName: 'aggregatelock'
  };

  this.options = _.defaults(this.options, defaults);
}

util.inherits(Datastore, Lock);

_.extend(Datastore.prototype, {
  
  AGGREGATE_KIND: "Aggregate",

  connect: function (callback) {
    var self = this;
    self.client = new DS(self.options);
    self.isConnected = true;

    self.emit('connect');
    if (callback) callback(null, self);
  },

  disconnect: function (callback) {
    // do nothing on cloud datastore client
    this.emit('disconnect');
    if (callback) callback(null);
  },

  reserve: function(workerId, aggregateId, callback) {
    var self = this;
    var client = self.client;

    var entity = {
      key: client.key([self.AGGREGATE_KIND, aggregateId, self.options.lockTableName, workerId]),
      data: {
        aggregateId: aggregateId,
        workerId: workerId,
        timeStamp: new Date()
      }
    };

    client.save(entity, function(err, apiResponse) {
      if(callback) callback(err);
    });
  },

  getAll: function(aggregateId, callback) {
    var self = this;
    var client = self.client;

    if (callback) {
      var q = client
        .createQuery(self.options.lockTableName)
        .hasAncestor(client.key([self.AGGREGATE_KIND, aggregateId]))
        .order("timeStamp");

      client.runQuery(q, function(err, entities, info) {
        if (err) {
          return callback(err);
        }
        
        var res = entities.map(function(r){ return r.workerId});
        callback(null, res);
      });
    }
  },

  resolve: function(aggregateId, callback) {
    var self = this;
    var client = self.client;

    var q = client
      .createQuery(self.options.lockTableName)
      .select('__key__')
      .hasAncestor(client.key([self.AGGREGATE_KIND, aggregateId]));

    client.runQuery(q, function(err, entities) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      
      var keys = entities.map(function(r){ return r[client.KEY] });

      client.delete(keys, function(err) {
        if (callback) callback(err);
      });
    });
  },

  clear: function(callback) {
    var self = this;
    var client = self.client;

    var q = client
      .createQuery(self.options.lockTableName)
      .select('__key__');

    client.runQuery(q, function(err, entities) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      
      var keys = entities.map(function(r){ return r[client.KEY] });

      client.delete(keys, function(err) {
        if (callback) callback(err);
      });
    });
  }

});

module.exports = Datastore;