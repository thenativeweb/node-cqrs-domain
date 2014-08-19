var _ = require('lodash');

module.exports = require('cqrs-domain').defineCommand({
  name: 'unregisterAllContactInformation'//,  // optional, default is file name without extenstion and without _vx
  // version: 1, // optional, default 1
  // versionPath: 'version', // can be defined globally, but can be overwritten here...
  // payload: 'payload' // if not defined it will pass the whole command...
}, function (cmd, aggregate) {

  _.each(aggregate.get('phoneNumbers'), function(number) {
    aggregate.apply(aggregate.toEvent('unregisteredPhoneNumber', {
      number: number
    }));
    // or
    // aggregate.apply(aggregate.toEvent({
    //   event: 'unregisteredPhoneNumber',
    //   payload: {
    //     number: number
    //   }
    // }));
  });

  _.each(aggregate.get('emails'), function(mail) {
    aggregate.apply(aggregate.toEvent('unregisteredEMailAddress', {
      mail: mail
    }));
    // or
    // aggregate.apply(aggregate.toEvent({
    //   event: 'unregisteredEMailAddress',
    //   payload: {
    //     mail: mail
    //   }
    // }));
  });
});
