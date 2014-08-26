module.exports = require('cqrs-domain').defineEventConversion({
  name: 'enteredNewPerson', // optional, default is file name without extenstion and without _vx
  version: 2,
  payload: 'payload' // if not defined it will pass the whole event...
}, function (data, aggregate) {
  aggregate.set('firstname', data.firstName);
  aggregate.set('lastname', data.lastName);
});
