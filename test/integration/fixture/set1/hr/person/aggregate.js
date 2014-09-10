// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineAggregate({
module.exports = require('../../../../../../').defineAggregate({
  name: 'person', // optional, default is last part of path name
  version: 3, // optional, default 0
  defaultCommandPayload: 'payload'//,
//  defaultEventPayload: 'payload'
},
// optionally, define some initialization data...
{
  emails: ['default@mycomp.org'],
  phoneNumbers: []
})
  // define snapshot need algorithm...
.defineSnapshotNeed(function (loadingTime, events, aggregate) {
  return events.length >= 20;
})
// always convert directly to newest version...
.defineSnapshotConversion({
  version: 2
}, function (data, aggregate) {
  aggregate.set('emails', data.emails);
  aggregate.set('phoneNumbers', data.phoneNumbers);

  aggregate.set('firstname', data.firstName);
  aggregate.set('lastname', data.lastName);
})
// always convert directly to newest version...
.defineSnapshotConversion({
  version: 1
}, function (data, aggregate) {
  aggregate.set('emails', data.emails);
  aggregate.set('phoneNumbers', data.phoneNumbers);

  var names = data.name.split(' ');
  aggregate.set('firstname', names[0]);
  aggregate.set('lastname', names[1]);
});
// info to me: when loaded a snapshot create a new snapshot with same revision with newer version