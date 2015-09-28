var _ = require('lodash');

module.exports = require('../../../../../../../../').defineBusinessRule({
  name: 'uniqueEmails',
  description: 'unique mail address'
}, function (changed, previous, events, command) {

  if (_.uniq(changed.get('mails')).length !== changed.get('mails').length) {
    throw new Error('email already used');
  }

});
