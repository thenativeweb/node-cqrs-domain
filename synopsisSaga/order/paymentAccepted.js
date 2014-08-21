// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-saga').defineSagaStep({// event to match...
  'name': 'paymentAccepted',
  'aggregate.name': 'payment',
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
      name: 'confirmOrder',
      aggregate: {
        name: 'order',
        id: saga.get('orderId')
      },
      context: {
        name: 'sale'
      },
      payload: {
        transactionId: saga.id
      },
      meta: evt.meta // to transport userId...
    };

    saga.send(cmd);

    saga.next([
      {
        'name': 'orderConfirmed',
        'aggregate.name': 'order',
        'aggregate.id': saga.get('orderId'),
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
  'name': 'paymentAccepted',
  'aggregate.name': 'payment',
  'context.name': 'sale'
}, { // optional settings
  containingProperties: ['payload.transactionId'],
  loadBy: 'payload.transactionId'
  // payload: 'payload' // if not defined it will pass the whole event...
}, function (evt, saga, callback) {

  var cmd = {
    // id: 'my onwn command id', // if you don't pass an id it will generate one, when emitting the command...
    name: 'confirmOrder',
    aggregate: {
      name: 'order',
      id: saga.get('orderId')
    },
    context: {
      name: 'sale'
    },
    payload: {
      transactionId: saga.id
    },
    meta: evt.meta // to transport userId...
  };

  saga.send(cmd);

  saga.next([
    {
      'name': 'orderConfirmed',
      'aggregate.name': 'order',
      'aggregate.id': saga.get('orderId'),
      'context.name': 'sale',
      'payload.transactionId': saga.id
    }
  ]);

  saga.commit(callback);
});
