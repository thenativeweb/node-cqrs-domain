//module.exports = require('cqrs-domain').defineEvent({
module.exports = [
  require('../../../../../../../').defineLoadingEventTransformer({
    name: 'enteredNewPerson', // optional, default is file name without extension
    version: 3
  }, function (evt) {
    if (evt.payload.firstname) {
      if (evt.payload.firstname.indexOf('_encrypted_') < 0) throw new Error('Encrypted prop not found!\nThis should not happen!');
      evt.payload.firstname = evt.payload.firstname.replace('_encrypted_', '');
    }
    return evt;
  }),
  require('../../../../../../../').defineCommittingEventTransformer({
    name: 'enteredNewPerson', // optional, default is file name without extension
    version: 3
  }, function (evt) {
    if (evt.payload.firstname) {
      if (evt.payload.firstname.indexOf('_encrypted_') === 0) throw new Error('Encrypted prop found!\nThis should not happen!');
      evt.payload.firstname = '_encrypted_' + evt.payload.firstname;
    }
    return evt;
  })
];
