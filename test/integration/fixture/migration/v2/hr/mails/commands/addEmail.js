module.exports = require('../../../../../../../../').defineCommand({
  name: 'addEmail',
  version: 0
}, function (data, aggregate) {
  aggregate.apply('emailAdded', data);
})
.defineEventStreamsToLoad(function (cmd) {
  return [{ // order is new to old
    context: 'hr',
    aggregate: 'mails',
    aggregateId: cmd.aggregate.id
  },{
    context: 'hr',
    aggregate: 'persons',
    aggregateId: cmd.meta.oldAggId
  }];
});
