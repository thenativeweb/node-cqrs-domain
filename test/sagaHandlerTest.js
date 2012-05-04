var expect = require('expect.js')
  , EventEmitter = require('events').EventEmitter
  , eventEmitter = require('../lib/eventEmitter')
  , sagaHandlerBase = require('../index').sagaHandlerBase
  , sagaBase = require('../index').sagaBase;

var stream = new EventEmitter();
var commandEmitter = new EventEmitter();

var Saga = sagaBase.extend({
    somethingDoneEvent: function(evt) {
        this.set('a', 'b');
        this.set({ c: 'd' });
        evt.command = 'blaCmd';
        delete evt.event;
        delete evt.commandId;
        this.sendCommand(evt);
        commandEmitter.emit('done');
    }
});
var saga = new Saga('id_1');
saga.isInited = true;

var sagaHandler = sagaHandlerBase.extend({
    events: ['somethingDoneEvent'],
    saga: 'overridden load!',

    stream: stream,

    loadSaga: function(id, callback) {
        this.saga = saga;

        callback(null, this.saga);
    },

    commit: function(saga, callback) {
        this.stream.data = saga.toJSON();
        this.stream.emit('done', this.stream.data);
    }
});


describe('SagaHandlerBase', function() {

    describe('calling handle function', function() {

        // given 
        var evt = {
            event: 'somethingDoneEvent',
            payload: {
                id: 'id_1',
                setMe: 'bimbimbim'
            }
        };
        
        it('it should have data of saga', function(done) {
            // then
            sagaHandler.stream.once('done', function(data) {
                expect(data.id).to.eql('id_1');
                expect(data.a).to.eql('b');
                expect(data.c).to.eql('d');
                done();
            });

            // when
            sagaHandler.handle(evt);
        });

        it('it should be have unemittedCommands', function(done) {
            var cmdEmitted = false;
            eventEmitter.once('command:blaCmd', function() {
                cmdEmitted = true;
            });
            // then
            commandEmitter.once('done', function() {
                expect(cmdEmitted).to.be.eql(true);
                done();
            });

            // when
            sagaHandler.handle(evt);
        });

    });

});
