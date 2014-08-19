var _ = require('lodash');

module.exports = require('cqrs-domain').defineEvent({
  name: 'unregisteredEMailAddress', // optional, default is file name without extenstion and without _vx
  // version: 1, // optional, default 1
  // versionPath: 'version', // can be defined globally, but can be overwritten here...
  payload: 'payload' // if not defined it will pass the whole event...
}, function (data, aggregate) {
  aggregate.set('emails', _.without(aggregate.get('emails'), data.mail));
});
