var processManagement = require('cqrs-saga')({
  sagaPath: __dirname + '/',
});

processManagement.defineCommand({
  id: 'id',
  name: 'name',                   // optional
  context: 'context.name',        // optional
  aggregate: 'aggregate.name',    // optional
  aggregateId: 'aggregate.id',    // optional
  payload: 'payload',             // optional
  revision: 'revision',           // optional
  version: 'version',             // optional
  meta: 'meta'                    // optional
});

processManagement.defineEvent({
  id: 'id',                       // optional
  correlationId: 'correlationId', // optional
  name: 'name',                   // optional
  context: 'context.name',        // optional
  aggregate: 'aggregate.name',    // optional
  aggregateId: 'aggregate.id',    // optional
  payload: 'payload',             // optional
  revision: 'revision',           // optional
  version: 'version',             // optional
  meta: 'meta'                    // optional
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

processManagement.handle({ id: 'msgId', event: 'dummyCreated', payload: { id: '23445' } }, function (err, cmds) { // optional callback
  // event is handled, cmds is result
});
