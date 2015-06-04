// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineCommand({
module.exports = require('../../../../../../../../').defineCommand({
  name: 'enterNewPerson',
  version: 1
}, function (data, aggregate) {
  aggregate.apply('enteredNewPerson', data, 1);
});
