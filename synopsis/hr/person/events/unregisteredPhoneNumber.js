var _ = require('lodash');

// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-domain').defineEvent({
  name: 'unregisteredPhoneNumber'//,  // optional, default is file name without extenstion and without _vx
  // version: 1, // optional, default 1
  // payload: 'payload' // if not defined it will pass the whole event...
}, function (cmd, aggregate) {
  aggregate.set('phoneNumbers', _.without(aggregate.get('phoneNumbers'), cmd.payload.number));
});
