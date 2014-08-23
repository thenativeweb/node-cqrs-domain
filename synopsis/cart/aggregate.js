// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineAggregate({
module.exports = require('../../').defineAggregate({
    name: 'cart', // optional, default is last part of path name
//    version: 1//, // optional, default 1
    // versionPath: 'version', // can be defined globally, but can be overwritten here...
    // snapshotThreshold: 20 // can be defined globally, but can be overwritten here...
    // or
    // snapshotThreshold: function() { return 12 + 10; },
  }
);