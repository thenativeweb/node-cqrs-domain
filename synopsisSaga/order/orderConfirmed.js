// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-saga').defineSagaStep({// event to match...
  'name': 'orderConfirmed',
  'aggregate.name': 'order',
  'context.name': 'sale'
}, { // optional settings
  containingProperties: ['payload.transactionId']
  // payload: 'payload' // if not defined it will pass the whole event...
}, function (evt, sagaHandler, callback) {

  sagaHandler.get(evt.payload.transactionId, function (err, saga) {
    if (err) {
      return callback(err);
    }
    saga.destroy();
    saga.commit(callback);
  });

});

// or
// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-saga').defineSagaStep({// event to match...
  'name': 'orderConfirmed',
  'aggregate.name': 'order',
  'context.name': 'sale'
}, { // optional settings
  containingProperties: ['payload.transactionId'],
  loadBy: 'payload.transactionId'
  // payload: 'payload' // if not defined it will pass the whole event...
}, function (evt, saga, callback) {

  saga.destroy();
  saga.commit(callback);

});
