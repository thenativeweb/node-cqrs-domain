var sagaHandlerBase = require('../../../index').sagaHandlerBase;

module.exports = sagaHandlerBase.extend({

    events: ['dummyCancelled'],

    saga: 'dummySaga'

});
