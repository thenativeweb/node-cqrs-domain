'use strict';

var util = require('util'),
  Lock = require('../base'),
  _ = require('lodash'),
  async = require('async'),
  azure = Lock.use('azure-storage'),
  eg = azure.TableUtilities.entityGenerator;

function AzureTable(options) {
  Lock.call(this, options);

  var azureConf = {
    storageAccount: 'nodecqrs',
    storageAccessKey: 'StXScH574p1krnkjbxjkHkMkrtbIMQpYMbH1D1uYVqS4ny/DpXVkL4ld02xeKupCQnIIN+v0KVmdLLSVA/cxTQ==',
    storageTableHost: 'https://nodecqrs.table.core.windows.net/'
  };

  this.options = _.defaults(options, azureConf);

  var defaults = {
    lockTableName: 'aggregatelock'
  };

  this.options = _.defaults(this.options, defaults);
}

util.inherits(AzureTable, Lock);

_.extend(AzureTable.prototype, {

  connect: function (callback) {
    var retryOperations = new azure.ExponentialRetryPolicyFilter();

    var self = this;

    this.client = azure.createTableService(this.options.storageAccount, this.options.storageAccessKey, this.options.storageTableHost).withFilter(retryOperations);

    this.client.createTableIfNotExists(this.options.lockTableName, function (err) {
      if (err) {
        if (callback) callback(err);
        return;
      }

      self.emit('connect');
      if (callback) callback(null, self);
    });
  },

  disconnect: function (callback) {
    this.emit('disconnect');
    if (callback) callback(null);
  },

  reserve: function (workerId, aggregateId, callback) {
    var entity = {
      PartitionKey: eg.String(aggregateId),
      RowKey: eg.String(workerId),
      workerId: eg.String(workerId),
      aggregateId: eg.String(aggregateId),
      date: eg.DateTime(new Date())
    };

    this.client.insertEntity(this.options.lockTableName, entity, function (err) {
      if (callback) callback(err);
    });
  },

  getAll: function (aggregateId, callback) {
    var query = new azure.TableQuery();

    var options = {
      autoResolveProperties: true,
      entityResolver: function (entity) {
        return entity.workerId._;
      }
    };
    query.select('workerId');
    query.where('PartitionKey eq ?', aggregateId);

    this.client.queryEntities(this.options.lockTableName, query, null, options, function (err, result) {
      var res = [];

      if (err) {
        return callback(err);
      }

      res = _.sortBy(result.entries, "date");

      callback(null, res);
    });
  },

  resolve: function (aggregateId, callback) {

    var self = this;

    var query = new azure.TableQuery();
    query.where('PartitionKey eq ?', aggregateId);

    this.client.queryEntities(this.options.lockTableName, query, null, function (err, result) {
      if (err) {
        if (callback) callback(err);
        return;
      }

      async.each(result.entries, function (entity, callback) {
        self.client.deleteEntity(self.options.lockTableName, entity, function (err, response) {
          callback(err);
        });
      },
      function (err) {
        if (callback) callback(err);
      });
    });
  },

  clear: function (callback) {
    var self = this;

    this.client.queryEntities(this.options.lockTableName, null, null, function (err, entities) {
      if (err) {
        return callback(err);
      }

      async.each(entities.entries, function (entity, callback) {
        self.client.deleteEntity(self.options.lockTableName, entity, function (err, response) {
          callback(err);
        });
      },
      function (err) {
        if (callback) callback(err);
      });
    });
  }
});

module.exports = AzureTable;
