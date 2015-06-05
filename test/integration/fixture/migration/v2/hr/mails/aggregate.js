// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineAggregate({
module.exports = require('../../../../../../../').defineAggregate({
  name: 'mails', // optional, default is last part of path name
  version: 0, // optional, default 0
  defaultCommandPayload: 'payload',
  defaultEventPayload: 'payload',
  defaultPreConditionPayload: 'payload'
},
{
  mails: []
})
.defineSnapshotNeed(function (loadingTime, events, aggregate) {
  return events.length >= 2;
})
.defineSnapshotConversion({
  context: 'hr',
  aggregate: 'persons',
  version: 0
}, function (data, aggregate) {
  data.persons.forEach(function (p) {
    aggregate.get('mails').push(p.email);
  });
});