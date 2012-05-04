var expect = require('expect.js')
  , aggregateBase = require('../index').aggregateBase
  , ruleBase = require('rule-validator');

var valRules = ruleBase.extend(
    {
        doSomethingCommand: {
            setMePass: {
                type: 'string',
                minLength: 1
            },
            setMeFails: {
                type: 'string',
                minLength: 100
            }
        }
    }
);

var Aggregate = aggregateBase.extend({

    doSomethingCommand: function(data, callback) {
        this.apply(this.toEvent('SomethingDoneEvent', data), callback);
    },

    SomethingDoneEvent: function(data) {
        this.set(data);
    }, 

    validationRules: valRules,

    businessRules: [
        function(changed, previous, callback) {
            if (changed.a > changed.b) {
                callback('b must be bigger than a!');
            } else {
                callback(null);
            }
        },
        function(changed, previous, callback) {
            if (changed.d > changed.c) {
                callback('c must be bigger than d!');
            } else {
                callback(null);
            }
        },
        function(changed, previous, callback) {
            if (changed.a < previous.a) {
                callback('a must be bigger than a before!');
            } else {
                callback(null);
            }
        }
    ]
});
var aggregate = new Aggregate('id_1');
aggregate.set({revision: 0});

describe('Aggregation Base', function() {

    describe('command validation', function() {
        
        it('it should pass given valid data', function(done) {
            aggregate.validate('doSomethingCommand', { setMePass: 'ok' }, function(err) {
                expect(err).not.to.be.ok();
                done();
            });
        });

        it('it should fail given invalid data', function(done) {
            aggregate.validate('doSomethingCommand', { setMeFails: 'nok' }, function(err) {
                expect(err).to.be.ok();
                done();
            });
        });

    });

    describe('business rules validation', function() {
        
        it('it should pass given valid data', function(done) {
            aggregate.doSomethingCommand( { a: 2, b: 7} );
            aggregate.checkBusinessRules(function(err) {
                expect(err).not.to.be.ok();
                done();
            });
        });

        it('it should fail given invalid data', function(done) {
            aggregate.doSomethingCommand( { a: 8, b: 2} );
            aggregate.checkBusinessRules(function(err) {
                expect(err).to.be.ok();
                done();
            });
        });

        it('it should fail with second rule', function(done) {
            aggregate.doSomethingCommand( { d: 8, c: 2} );
            aggregate.checkBusinessRules(function(err) {
                expect(err).to.be.ok();
                done();
            });
        });

        it('it should fail with rule that uses previous', function(done) {
            aggregate.doSomethingCommand( { a: 1, b: 2} );
            aggregate.checkBusinessRules(function(err) {
                expect(err).to.be.ok();
                done();
            });
        });

    });

});