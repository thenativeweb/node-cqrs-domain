var commandHandlerBase = require('../../../index').commandHandlerBase;

module.exports = commandHandlerBase.extend({

    commands: ['changeDummy', 'destroyDummy', 'cancelDummy', 'fooIt' ],

    aggregate: 'dummyAggregate',

    fooIt: function(id, cmd) {
        var self = this;
        (new this.Command({
            command: 'createFoo',
            payload: {
                name: 'bla'
            }
        })).emit(function(evt) {
            cmd.payload.fooId = evt.payload.id;
            self.defaultHandle(id, cmd);
        });
    }

});
