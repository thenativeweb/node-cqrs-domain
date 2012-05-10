var base = require('../../../index').aggregateBase;

module.exports = base.extend({

    createFoo: function(data, callback) {
        this.apply(this.toEvent('fooCreated', data));

        this.checkBusinessRules(callback);
    },

    fooCreated: function(data) {
        this.set(data);
    }

});