// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineEvent({
module.exports = require('../../../../../../../../').defineEvent({
  name: 'emailAdded',
  version: 0
}, function (data, aggregate) {
  aggregate.get('mails').push(data.email);
});
