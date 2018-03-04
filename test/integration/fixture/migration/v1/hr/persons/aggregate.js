// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineAggregate({
module.exports = require('../../../../../../../').defineAggregate({
  name: 'persons', // optional, default is last part of path name
  version: 0, // optional, default 0
  defaultCommandPayload: 'payload',
  defaultEventPayload: 'payload',
  defaultPreConditionPayload: 'payload'
},
{
  persons: []
})
.defineSnapshotNeed(function (loadingTime, events, aggregate) {
  return events.length >= 2;
})
.defineLoadingSnapshotTransformer({
  version: 0
}, function (snap) {
  if (snap.persons) {
    for (var i = 0; i < snap.persons.length; i++) {
      if (snap.persons[i].firstname.indexOf('_encrypted_') < 0) throw new Error('Encrypted prop not found!\nThis should not happen!');
      snap.persons[i].firstname = snap.persons[i].firstname.replace('_encrypted_', '');
    }
  }
  return snap;
})
.defineCommittingSnapshotTransformer({
  version: 0
}, function (snap) {
  if (snap.persons) {
    for (var i = 0; i < snap.persons.length; i++) {
      if (snap.persons[i].firstname.indexOf('_encrypted_') === 0) throw new Error('Encrypted prop found!\nThis should not happen!');
      snap.persons[i].firstname = '_encrypted_' + snap.persons[i].firstname;
    }
  }
  return snap;
});
