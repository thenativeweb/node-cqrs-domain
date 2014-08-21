// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-saga').defineSagaStart({// event to match...
  'name': 'orderCreated'
}, { // optional settings
  // payload: 'payload' // if not defined it will pass the whole event...
}, function (evt, sagaHandler, callback) {

  sagaHandler.get(function (err, saga) {
    if (err) {
      return callback(err);
    }

    // saga.id or saga.get('id') is a generated id...

    saga.set('orderId', evt.aggregate.id);
    saga.set('totalCosts', evt.payload.totalCosts);

    var cmd = {
      // id: 'my onwn command id', // if you don't pass an id it will generate one, when emitting the command...
      name: 'makeReservation',
      aggregate: {
        name: 'reservaion'
      },
      context: {
        name: 'sale'
      },
      payload: {
        transactionId: saga.id,
        seats: evt.payload.seats
      },
      meta: evt.meta // to transport userId...
    };

    saga.send(cmd);

    saga.next([
      {
        'name': 'seatsReserved',
        'aggregate.name': 'reservaion',
        'context.name': 'sale',
        'payload.transactionId': saga.id
      },
      {
        'name': 'seatsNotReserved',
        'aggregate.name': 'reservaion',
        'context.name': 'sale',
        'payload.transactionId': saga.id
      }
    ]);

    saga.commit(callback);
  });

});

// or
// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-saga').defineSagaStart({// event to match...
  'name': 'orderCreated'
}, { // optional settings
  loadBy: null
  // payload: 'payload' // if not defined it will pass the whole event...
}, function (evt, saga, callback) {

  // saga.id or saga.get('id') is a generated id...

  saga.set('orderId', evt.aggregate.id);
  saga.set('totalCosts', evt.payload.totalCosts);

  var cmd = {
    // id: 'my onwn command id', // if you don't pass an id it will generate one, when emitting the command...
    name: 'makeReservation',
    aggregate: {
      name: 'reservaion'
    },
    context: {
      name: 'sale'
    },
    payload: {
      transactionId: saga.id,
      seats: evt.payload.seats
    },
    meta: evt.meta // to transport userId...
  };

  saga.send(cmd);

  saga.next([
    {
      'name': 'seatsReserved',
      'aggregate.name': 'reservaion',
      'context.name': 'sale',
      'payload.transactionId': saga.id
    },
    {
      'name': 'seatsNotReserved',
      'aggregate.name': 'reservaion',
      'context.name': 'sale',
      'payload.transactionId': saga.id
    }
  ]);

  saga.commit(callback);
});
