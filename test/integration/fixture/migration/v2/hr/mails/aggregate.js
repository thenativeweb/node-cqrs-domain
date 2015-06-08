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
});