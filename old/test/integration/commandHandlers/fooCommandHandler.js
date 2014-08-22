var commandHandlerBase = require('../../../index').commandHandlerBase;

module.exports = commandHandlerBase.extend({

    commands: ['createFoo' ],

    aggregate: 'fooAggregate'

});
