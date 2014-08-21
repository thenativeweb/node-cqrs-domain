var processManagement = require('cqrs-saga')({
  sagaPath: __dirname + '/',
});

processManagement.defineCommand({
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

processManagement.defineEvent({
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

processManagement.onCommand(function(cmd) {
  // bus.emit('command', cmd);
});
// or
// processManagement.onCmmand(function(cmd, callback) {
//   // bus.sendAndWaitForAck('command', cmd, callback);
// });

processManagement.init(function(err) {
  // callback optional
});

// ...

processManagement.handle({ id: 'msgId', event: 'dummyCreated', payload: { id: '23445' } }, function (err) {
  // event is queued, but just in memory....
});
