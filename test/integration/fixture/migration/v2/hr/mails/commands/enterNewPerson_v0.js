// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineCommand({
module.exports = require('../../../../../../../../').defineCommand({
  name: 'enterNewPerson',
  version: 0,
  source: {
    aggregate: 'persons', // old command location
    context: 'hr'         // old command location
  }
}, function (data, aggregate) {
  aggregate.apply('enteredNewPerson', data, 0);
})
.defineEventStreamsToLoad(function (cmd) {
  return [{
    context: 'hr',
    aggregate: 'mails',
    aggregateId: cmd.meta.newAggId
  },{
    context: 'hr',
    aggregate: 'persons',
    aggregateId: cmd.aggregate.id
  }];
});
