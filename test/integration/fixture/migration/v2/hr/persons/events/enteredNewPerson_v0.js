// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineEvent({
module.exports = require('../../../../../../../../').defineEvent({
  name: 'enteredNewPerson',
  version: 0
}, function (data, aggregate) {
  // console.log('OOOOLLLLLDDDDDDD');
  aggregate.get('persons').push(data);
});
