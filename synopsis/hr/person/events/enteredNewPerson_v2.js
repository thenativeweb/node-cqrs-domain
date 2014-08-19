// always convert directly to newest version...
module.exports = require('cqrs-domain').defineEventConversion({
  name: 'enteredNewPerson', // optional, default is file name without extenstion and without _vx
  version: 2,
  // versionPath: 'version', // can be defined globally, but can be overwritten here...
  payload: 'payload' // if not defined it will pass the whole event...
}, function (data, aggregate) {
  aggregate.apply(aggregate.toEvent('enteredNewPerson', {
    firstname: data.firstName,
    lastname: data.lastName
  }));
  // or
  // aggregate.apply(aggregate.toEvent({
  //   event: 'enteredNewPerson',
  //   payload: {
  //     firstname: data.firstName,
  //     lastname: data.lastName
  //   }
  // }));
});
