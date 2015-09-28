module.exports = require('../../../../../../../../').defineEvent({
  name: 'enteredNewPerson',
  version: 1
}, function (data, aggregate) {
  // console.log('NNNNEEEEEWWWWWWW');
  aggregate.get('persons').push(data);
});
