var _ = require('lodash');

// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineCommand({
module.exports = require('../../../../../../../').defineCommand({
  name: 'unregisterAllContactInformation', // optional, default is file name without extension
  version: 1//, // optional, default 0
  // payload: 'payload' // if not defined it will pass the whole command...
}, function (cmd, aggregate) {

  if (cmd.payload.indexOf('phoneNumbers') >= 0)  {
    _.each(aggregate.get('phoneNumbers'), function(number) {
      aggregate.apply('unregisteredPhoneNumber', {
        number: number
      });
      // or
      // aggregate.apply({
      //   event: 'unregisteredPhoneNumber',
      //   payload: {
      //     number: number
      //   }
      // });
    });
  }

  if (cmd.payload.indexOf('emails') >= 0) {
    _.each(aggregate.get('emails'), function(mail) {
      aggregate.apply('unregisteredEMailAddress', {
        mail: mail
      });
      // or
      // aggregate.apply({
      //   event: 'unregisteredEMailAddress',
      //   payload: {
      //     mail: mail
      //   }
      // });
    });
  }
});
