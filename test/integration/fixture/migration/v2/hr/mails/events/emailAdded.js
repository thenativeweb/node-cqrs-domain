module.exports = require('../../../../../../../../').defineEvent({
  name: 'emailAdded',
  version: 0
}, function (data, aggregate) {
  aggregate.get('mails').push(data.email);
});
