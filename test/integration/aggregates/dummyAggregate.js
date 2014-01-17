var base = require('../../../index').aggregateBase;

module.exports = base.extend({

    // snapshotThreshold: 20, 
    // or
    // snapshotThreshold: function() { return 12 + 10; },
    // 
    // used to version the snap shots
    // version: 3,
    // 
    // laodSnapshot: function(data, version) {
    //     if (version === 1) {
    //         this.set(snap.data);
    //     } else {
    //         this.set(snap.data);
    //     }
    // },

    // commands
    
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

    versionedCmd: function(data, callback) {
        this.apply(this.toEvent('versionedEvt', data), callback);
    },

    versionedCmd_1: function(data, callback) {
        this.apply(this.toEvent('versionedEvt', data, 1), callback);
    },


    // events
    
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
    },

    versionedEvt: function(data) {
        this.set(data);
    },

    versionedEvt_1: function(data) {
        this.set(data);
    }

});