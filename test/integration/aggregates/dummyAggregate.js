var base = require('../../../index').aggregateBase;

module.exports = base.extend({

    changeDummy: function(data, callback) {
        this.apply(this.toEvent('dummyChanged', data));

        this.checkBusinessRules(callback);
    },

    destroyDummy: function(data, callback) {
        this.apply(this.toEvent('dummyDestroyed', data));

        this.checkBusinessRules(callback);
    },

    cancelDummy: function(data, callback) {
        this.apply(this.toEvent('dummyCancelled', data));

        this.checkBusinessRules(callback);
    },

    fooIt: function(data, callback) {
        this.apply(this.toEvent('fooIted', data));

        this.checkBusinessRules(callback);
    },

    dummyChanged: function(data) {
        this.set(data);
    },

    dummyCancelled: function(data) {
        this.set('cancelled', true);
    },

    dummyDestroyed: function(data) {
        this.set('destroyed', true);
    },

    fooIted: function(data) {
        this.set('foo', true);
    }

});