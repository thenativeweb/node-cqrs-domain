module.exports = require('../../../../../../../../').defineEvent({
  name: 'enteredNewPerson',
  version: 0
}, function (data, aggregate) {
  aggregate.get('mails').push(data.email);
});
