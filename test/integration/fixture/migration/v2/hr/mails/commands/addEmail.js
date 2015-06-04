module.exports = require('../../../../../../../../').defineCommand({
  name: 'addEmail',
  version: 0
}, function (data, aggregate) {
  aggregate.apply('emailAdded', data);
});
