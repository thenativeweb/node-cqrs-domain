// this file is optional, default the last part of the path will be taken as context name
// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-domain').defineContext({
  name: 'context'
});
