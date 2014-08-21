// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-domain').defineCommand({
  name: 'enterNewPerson',  // optional, default is file name without extenstion and without _vx
  // version: 1, // optional, default 1
  // versionPath: 'version', // can be defined globally, but can be overwritten here...
  payload: 'payload' // if not defined it will pass the whole command...
}, function (data, aggregate) {
  aggregate.apply(aggregate.toEvent('enteredNewPerson', data));
  // or
  // aggregate.apply(aggregate.toEvent({
  //   event: 'enteredNewPerson',
  //   payload: data
  // }));
});
