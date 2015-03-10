// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineBusinessRule({
module.exports = require('../../../../../../../').definePreCondition({
  name: ['unregisterAllContactInformation'],  // optional, default is file name without extension
  version: 2, // optional, default 0
  payload: '', // if not defined it will use what is defined as default in aggregate or pass the whole command...
  description: 'firstname should always be set',
  priority: 2 // optional, default Infinity, all pre-conditions will be sorted by this value
}, function (command, agg, callback) {
  if (!agg.has('firstname')) {
    return callback('not personalized');
    // or
    // return callback(new Error('not personalized'));
    // or
    // return callback(new Error()); // if no error message is defined then the description will be taken
  }
  callback(null);
});
