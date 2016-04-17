// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineBusinessRule({
module.exports = require('../../../../../../../').definePreLoadCondition({
  name: '',  // optional, default is file name without extension
  payload: '', // if not defined it will use what is defined as default in aggregate or pass the whole command...
  description: 'just a nice little test',
  priority: 1 // optional, default Infinity, all pre-conditions will be sorted by this value
}, function (command, callback) {
  if (command.failPreLoadCondition) {
    return callback('precondition failed!');
    // or
    // return callback(new Error('not authorized'));
    // or
    // return callback(new Error()); // if no error message is defined then the description will be taken
  }
  callback(null);
});
