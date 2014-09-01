// Is your use case not solvable without a custom command handling? Sagas? Micro-Services?

// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineCommandHandler({
module.exports = require('../../../../../../../').defineCommandHandler({
  name: 'enterNewSpecialPerson'//,  // optional, default is file name without extension
  // version: 1, // optional, default 0
  // payload: 'payload' // if not defined it will pass the whole command...
}, function (cmd, commandHandler, callback) {
  // if cmd was sent without aggregateId, now in cmd there is a generated aggregateId...

  var id = cmd.aggregate && cmd.aggregate.id ? cmd.aggregate.id : cmd.payload.id;
  
  commandHandler.loadAggregate(id, function (err, aggregate, stream) {
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
