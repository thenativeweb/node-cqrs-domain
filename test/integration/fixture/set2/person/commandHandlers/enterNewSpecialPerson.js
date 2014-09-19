// Is your use case not solvable without a custom command handling? Sagas? Micro-Services?

// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineCommandHandler({
module.exports = require('../../../../../../').defineCommandHandler({
  name: 'enterNewSpecialPerson'//,  // optional, default is file name without extension and without _vx
  // payload: 'payload' // if not defined it will pass the whole command...
}, function (aggId, cmd, commandHandler, callback) {
  commandHandler.loadAggregate(aggId, function (err, aggregate, stream) {
    if (err) {
      return callback(err);
    }
    
    callback(null, [{ my: 'special', ev: 'ent' }]);

//    // check if destroyed, check revision, validate command
//    var err = commandHandler.verifyAggregate(aggregate, cmd);
//    if (err) {
//      return callback(err);
//    }
//
//    // call api or emit a command or whatever...
//    // and at the end perhaps you call: commandHandler.handle(cmd, callback);
  });
});
