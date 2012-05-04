var commandHandlerBase = require('../../../index').commandHandlerBase;

module.exports = commandHandlerBase.extend({

    commands: ['changeDummy', 'destroyDummy', 'cancelDummy' ],

    aggregate: 'dummyAggregate'

});
