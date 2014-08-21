// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-saga').defineSagaStep({// event to match...
  'name': 'seatsReserved',
  'aggregate.name': 'reservaion',
  'context.name': 'sale'
}, { // optional settings
  containingProperties: ['payload.transactionId']
  // payload: 'payload' // if not defined it will pass the whole event...
}, function (evt, sagaHandler, callback) {

  sagaHandler.get(evt.payload.transactionId, function (err, saga) {
    if (err) {
      return callback(err);
    }

    var cmd = {
      // id: 'my onwn command id', // if you don't pass an id it will generate one, when emitting the command...
      name: 'makePayment',
      aggregate: {
        name: 'payment'
      },
      context: {
        name: 'sale'
      },
      payload: {
        transactionId: saga.id,
        costs: saga.get('totalCosts')
      },
      meta: evt.meta // to transport userId...
    };

    saga.send(cmd);

    saga.next([
      {
        'name': 'paymentAccepted',
        'aggregate.name': 'payment',
        'context.name': 'sale',
        'payload.transactionId': saga.id
      }
    ]);

    saga.commit(callback);
  });

});

// or
// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-saga').defineSagaStep({// event to match...
  'name': 'seatsReserved',
  'aggregate.name': 'reservaion',
  'context.name': 'sale'
}, { // optional settings
  containingProperties: ['payload.transactionId'],
  loadBy: 'payload.transactionId'
  // payload: 'payload' // if not defined it will pass the whole event...
}, function (evt, saga, callback) {

  var cmd = {
    // id: 'my onwn command id', // if you don't pass an id it will generate one, when emitting the command...
    name: 'makePayment',
    aggregate: {
      name: 'payment'
    },
    context: {
      name: 'sale'
    },
    payload: {
      transactionId: saga.id,
      costs: saga.get('totalCosts')
    },
    meta: evt.meta // to transport userId...
  };

  saga.send(cmd);

  saga.next([
    {
      'name': 'paymentAccepted',
      'aggregate.name': 'payment',
      'context.name': 'sale',
      'payload.transactionId': saga.id
    }
  ]);

  saga.commit(callback);
});
