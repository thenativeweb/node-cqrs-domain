module.exports = require('cqrs-domain').defineEvent({
  name: 'enteredNewPerson', // optional, default is file name without extenstion and without _vx
  version: 3, // optional, default 1
  // versionPath: 'version', // can be defined globally, but can be overwritten here...
  payload: 'payload' // if not defined it will pass the whole event...
}, function (data, aggregate) {
  aggregate.set(data);
  // or
  // aggregate.set('firstname', data.firstname);
  // aggregate.set('lastname', data.lastname);
});
