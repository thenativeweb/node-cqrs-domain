// http://jsonary.com/documentation/json-schema/

var domain = require('cqrs-domain')({
  domainPath: __dirname + '/',
  eventStore: {                                 // optional
    type: 'mongodb',                            // example with mongodb
    dbName: 'domain',
    eventsCollectionName: 'events',             // optional
    snapshotsCollectionName: 'snapshots',       // optional
    host: 'localhost',                          // optional
    port: 27017,                                // optional
    username: 'user',                           // optional
    password: 'pwd',                            // optional
    timeout: 60 * 1000                          // optional
  },
  aggregateLock: {                              // optional (used for distributed domain
                                                // [handling same aggregate instance on multiple machines])
    type: 'mongodb',                            // example with mongodb
    dbName: 'domain',
    collectionName: 'aggregatelock',            // optional
    host: 'localhost',                          // optional
    port: 27017,                                // optional
    username: 'user',                           // optional
    password: 'pwd',                            // optional
    timeout: 60 * 1000                          // optional
  },
  retryOnConcurrencyTimeout: 800                // optional (used for distributed domain
                                                // [handling same aggregate instance on multiple machines])
});

domain.eventStore.on('connect', function () {});
domain.eventStore.on('disconnect', function () {});
domain.aggregateLock.on('connect', function () {});
domain.aggregateLock.on('disconnect', function () {});

// any db connection...
domain.on('connect', function () {});
domain.on('disconnect', function () {});

domain.on('event', function(evt) {
  // send to bus
});

domain.defineCommand({
  id: 'id',
  name: 'name',
  context: 'context.name',        // optional
  aggregate: 'aggregate.name',    // optional
  aggregateId: 'aggregate.id',
  payload: 'payload',             // optional
  revision: 'revision',           // optional
  version: 'version',             // optional
  meta: 'meta'                    // optional (will be passed directly to corresponding event(s))
});

domain.defineEvent({
  id: 'id',
  correlationId: 'correlationId',
  name: 'name',
  context: 'context.name',        // optional
  aggregate: 'aggregate.name',    // optional
  aggregateId: 'aggregate.id',
  payload: 'payload',             // optional
  revision: 'revision',           // optional
  version: 'version',             // optional
  meta: 'meta'                    // optional (will be passed directly to corresponding event(s))
});

domain.init(function(err) {
  // callback optional
});

// ...

domain.handle({ id: 'msgId', command: 'createDummy', payload: { id: '23445' } }, function(err) {
  // saved in command queue...
});
