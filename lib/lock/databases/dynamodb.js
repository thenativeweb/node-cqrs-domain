'use strict';

var util = require('util'),
  Lock = require('../base'),
  _ = require('lodash'),
  async = require('async'),
  aws = Lock.use('aws-sdk');

function DynamoDB(options) {
  var awsConf = {
    region: 'ap-southeast-2',
    endpointConf: {}
  };

  if (process.env['AWS_DYNAMODB_ENDPOINT']) {
    awsConf.endpointConf = { endpoint: process.env['AWS_DYNAMODB_ENDPOINT'] };
  }

  this.options = _.defaults(options, awsConf);

  var defaults = {
    lockTableName: 'aggregatelock',
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 3
  };

  this.options = _.defaults(this.options, defaults);
}

util.inherits(DynamoDB, Lock);

_.extend(DynamoDB.prototype, {
  connect: function(callback) {
    var self = this;
    self.client = new aws.DynamoDB(self.options.endpointConf);
    self.documentClient = new aws.DynamoDB.DocumentClient({ service: self.client });
    self.isConnected = true;

    var createAggregatelockTable = function(done) {
      createTableIfNotExists(
        self.client,
        AggregatelockTableDefinition(self.options),
        done
      );
    };

    createAggregatelockTable(function(err) {
      if (err) {
        if (callback) callback(err);
      } else {
        self.emit('connect');
        if (callback) callback(null, self);
      }
    });
  },

  disconnect: function(callback) {
    this.emit('disconnect');
    if (callback) callback(null);
  },

  reserve: function(workerId, aggregateId, callback) {
    var self = this;

    var params = {
      TableName: self.options.lockTableName,
      Item: {
        aggregateId: aggregateId,
        workerId: workerId,
        timeStamp: new Date().getTime()
      }
    };
    self.documentClient.put(params, function(err, data) {
      if (callback) callback(err);
    });
  },

  getAll: function(aggregateId, callback) {
    var self = this;

    if (callback) {
      var params = {
        TableName: self.options.lockTableName,
        KeyConditionExpression: '#aggrId = :a',
        ExpressionAttributeNames: {
          '#aggrId': 'aggregateId'
        },
        ExpressionAttributeValues: {
          ':a': aggregateId
        }
      };
      self.documentClient.query(params, function(err, data) {
        var res = [];
        if (err) {
          if (callback) callback(err);
          return;
        }
        res = _.sortBy(data.Items, 'timeStamp');
        if (callback) callback(null, _.map(res, function(r){ return r.workerId}));
      });
    }
  },

  resolve: function(aggregateId, callback) {
    var self = this;

    var queryParams = {
      TableName: self.options.lockTableName,
      KeyConditionExpression: '#aggrId = :a',
      ExpressionAttributeNames: {
        '#aggrId': 'aggregateId'
      },
      ExpressionAttributeValues: {
        ':a': aggregateId
      }
    };

    self.documentClient.query(queryParams, function(err, data) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      async.each(
        data.Items,
        function(item, deleteCallback) {
          var params = {
            TableName: self.options.lockTableName,
            Key: { aggregateId: item.aggregateId, workerId: item.workerId }
          };
          self.documentClient.delete(params, function(deleteErr, data) {
            if (deleteErr) {
              return deleteCallback(deleteErr);
            }
            deleteCallback(null, data);
          });
        },
        function(err) {
          if (callback) callback(err);
        }
      );
    });
  },

  clear: function(callback) {
    var self = this;
    var query = {
      TableName: self.options.lockTableName
    };
    self.documentClient.scan(query, function(err, data) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      async.each(
        data.Items,
        function(item, callback) {
          var params = {
            TableName: self.options.lockTableName,
            Key: { aggregateId: item.aggregateId, workerId: item.workerId }
          };
          self.documentClient.delete(params, function(error, response) {
            callback(error);
          });
        },
        function(error) {
          if (callback) callback(error);
        }
      );
    });
  }
});

function AggregatelockTableDefinition(opts) {
  var def = {
    TableName: opts.lockTableName,
    KeySchema: [
      { AttributeName: 'aggregateId', KeyType: 'HASH' },
      { AttributeName: 'workerId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'aggregateId', AttributeType: 'S' },
      { AttributeName: 'workerId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: opts.ReadCapacityUnits,
      WriteCapacityUnits: opts.WriteCapacityUnits
    }
  };

  return def;
}

var createTableIfNotExists = function(client, params, callback) {
  var exists = function(p, cbExists) {
    client.describeTable({ TableName: p.TableName }, function(err, data) {
      if (err) {
        if (err.code === 'ResourceNotFoundException') {
          cbExists(null, { exists: false, definition: p });
        } else {
          cbExists(err);
        }
      } else {
        cbExists(null, { exists: true, description: data });
      }
    });
  };

  var create = function(r, cbCreate) {
    if (!r.exists) {
      client.createTable(r.definition, function(err, data) {
        if (err) {
          cbCreate(err);
        } else {
          cbCreate(null, {
            Table: {
              TableName: data.TableDescription.TableName,
              TableStatus: data.TableDescription.TableStatus
            }
          });
        }
      });
    } else {
      cbCreate(null, r.description);
    }
  };

  var active = function(d, cbActive) {
    var status = d.Table.TableStatus;
    async.until(
      function() {
        return status === 'ACTIVE';
      },
      function(cbUntil) {
        client.describeTable({ TableName: d.Table.TableName }, function(
          err,
          data
        ) {
          if (err) {
            cbUntil(err);
          } else {
            status = data.Table.TableStatus;
            setTimeout(cbUntil, 1000);
          }
        });
      },
      function(err, r) {
        if (err) {
          return cbActive(err);
        }
        cbActive(null, r);
      }
    );
  };

  async.compose(active, create, exists)(params, function(err, result) {
    if (err) callback(err);
    else callback(null, result);
  });
};

module.exports = DynamoDB;
