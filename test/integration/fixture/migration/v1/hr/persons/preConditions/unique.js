var _ = require('lodash');

module.exports = require('../../../../../../../../').definePreCondition({
  name: 'enterNewPerson',
  version: 0,
  description: 'unique mail address'
}, function (data, agg) {
  var found = _.find(agg.get('persons'), function (person) {
    return person.email === data.email;
  });
  if (found) {
    throw new Error('email already used');
  }
});
