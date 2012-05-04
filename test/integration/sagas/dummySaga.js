var base = require('../../../index').sagaBase;

module.exports = base.extend({

    dummyCancelled: function(data) {
        this.sendCommand( { command: 'destroyDummy', payload: { id: data.id } } );
    }

});