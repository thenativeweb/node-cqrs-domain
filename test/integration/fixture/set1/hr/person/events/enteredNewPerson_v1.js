//module.exports = require('cqrs-domain').defineEvent({
module.exports = require('../../../../../../../').defineEvent({
  name: 'enteredNewPerson', // optional, default is file name without extenstion and without _vx
  version: 1,
  payload: 'payload' // if not defined it will pass the whole event...
}, function (data, aggregate) {
  var names = data.name.split(' ');
  aggregate.set('firstname', names[0]);
  aggregate.set('lastname', names[1]);
});
