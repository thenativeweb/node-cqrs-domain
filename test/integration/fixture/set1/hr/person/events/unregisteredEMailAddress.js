var _ = require('lodash');

// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineEvent({
module.exports = require('../../../../../../../').defineEvent({
  name: 'unregisteredEMailAddress', // optional, default is file name without extension
  // version: 1, // optional, default 0
  payload: 'payload' // if not defined it will pass the whole event...
}, function (data, aggregate) {
  aggregate.set('emails', _.without(aggregate.get('emails'), data.mail));
});
