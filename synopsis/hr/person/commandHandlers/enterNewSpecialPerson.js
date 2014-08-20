// Is your use case not solvable without a custom command handling? Sagas? Micro-Services?

module.exports = require('cqrs-domain').defineCommandHandle({
  name: 'enterNewSpecialPerson'//,  // optional, default is file name without extenstion and without _vx
  // version: 1, // optional, default 1
  // versionPath: 'version', // can be defined globally, but can be overwritten here...
  // payload: 'payload' // if not defined it will pass the whole command...
}, function (cmd, commandHandler, callback) {
  // if cmd was sent without aggregateId, now in cmd there is a generated aggregateId...

  commandHandler.loadAggregate(cmd.aggregate.id, function (err, aggregate, stream) {
    if (err) {
      return callback(err);
    }

    // check if destroyed, check revision, validate command
    commandHandler.verify(aggregate, cmd, function (err) {
      if (err) {
        return callback(err);
      }

      // call api or emit a command or whatever...
      // and at the end perhaps you call: commandHandler.handle(cmd, callback);
    });
  });
});
