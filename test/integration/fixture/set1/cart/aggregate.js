// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineAggregate({
module.exports = require('../../../../../').defineAggregate({
    name: 'cart'//, // optional, default is last part of path name
//    version: 1//, // optional, default 1
  }
);