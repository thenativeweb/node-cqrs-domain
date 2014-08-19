// always convert directly to newest version...
module.exports = require('cqrs-domain').defineEventConversion({
  name: 'enteredNewPerson',
  version: 1,
  // versionPath: 'version', // can be defined globally, but can be overwritten here...
  payload: 'payload' // if not defined it will pass the whole event...
}, function (data, aggregate) {
  var names = data.name.split(' ');
  aggregate.apply(aggregate.toEvent('enteredNewPerson', {
    firstname: names[0],
    lastname: names[1]
  }));
  // or
  // aggregate.apply(aggregate.toEvent({
  //   event: 'enteredNewPerson',
  //   payload: {
  //     firstname: names[0],
  //     lastname: names[1]
  //   }
  // }));
});
