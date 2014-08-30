var _ = require('lodash');

// if exports is an array, it will be the same like loading multiple files...
//module.exports = require('cqrs-domain').defineEvent({
module.exports = [

  // aggregate
  require('../../../../../').defineAggregate({
    name: 'person'//, // optional, default is last part of path name
    // versionPath: 'version', // can be defined globally, but can be overwritten here...
    },
    // optionally, define some initialization data...
    {
      emails: ['default@mycomp.org'],
      phoneNumbers: []
    })
    // define snapshot need algorithm...
    .defineSnapshotNeed(function (loadingTime, events, aggregate) {
      return events.length >= 20;
    }
  ),

  // commands
  require('../../../../../').defineCommand({
    name: 'enterNewPerson',  // optional, default is file name without extenstion and without _vx
    // version: 1, // optional, default 0
    payload: 'payload' // if not defined it will pass the whole command...
  }, function (data, aggregate) {
    aggregate.apply('enteredNewPerson', data);
    // or
    // aggregate.apply({
    //   event: 'enteredNewPerson',
    //   payload: data
    // });
  }),

  require('../../../../../').defineCommand({
    name: 'unregisterAllContactInformation'//,  // optional, default is file name without extenstion and without _vx
    // payload: 'payload' // if not defined it will pass the whole command...
  }, function (cmd, aggregate) {

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

    _.each(aggregate.get('emails'), function(mail) {
      aggregate.apply('unregisteredEMailAddress', {
        email: mail
      });
      // or
      // aggregate.apply(aggregate.toEvent({
      //   event: 'unregisteredEMailAddress',
      //   payload: {
      //     email: mail
      //   }
      // });
    });
  }),
  

  // events

  require('../../../../../').defineEvent({
    name: 'enteredNewPerson', // optional, default is file name without extension
    payload: 'payload' // if not defined it will pass the whole event...
  }, function (data, aggregate) {
    aggregate.set('firstname', data.firstname);
    aggregate.set('lastname', data.lastname);
    aggregate.get('emails').push(data.email);
  }),

  require('../../../../../').defineEvent({
    name: 'unregisteredEMailAddress', // optional, default is file name without extenstion and without _vx
    // version: 1, // optional, default 0
    payload: 'payload' // if not defined it will pass the whole event...
  }, function (data, aggregate) {
    aggregate.set('emails', _.without(aggregate.get('emails'), data.email));
  }),

  require('../../../../../').defineEvent({
    name: 'unregisteredPhoneNumber'//,  // optional, default is file name without extenstion and without _vx
    // version: 1, // optional, default 0
    // payload: 'payload' // if not defined it will pass the whole event...
  }, function (cmd, aggregate) {
    aggregate.set('phoneNumbers', _.without(aggregate.get('phoneNumbers'), cmd.payload.number));
  })

];
