// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineEvent({
module.exports = require('../../../../../../../').defineEvent({
  name: 'enteredNewPerson', // optional, default is file name without extension
  version: 3, // optional, default 0
  payload: 'payload' // if not defined it will pass the whole event...
}, function (data, aggregate) {
  aggregate.set('firstname', data.firstname);
  aggregate.set('lastname', data.lastname);
  aggregate.get('emails').push(data.email);
});
