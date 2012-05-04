var expect = require('expect.js')
  , EventEmitter = require('events').EventEmitter
  , eventEmitter = require('../lib/eventEmitter')
  , sagaHandlerBase = require('../index').sagaHandlerBase
  , sagaBase = require('../index').sagaBase;

var stream = new EventEmitter();
var commandEmitter = new EventEmitter();

var Saga = sagaBase.extend({
    somethingDoneEvent: function(evt) {
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

        callback(null, this.saga, this.stream);
    },

    commit: function(uncommittedEvents, stream, callback) {
        stream.uncommittedEvents = uncommittedEvents;
        stream.emit('done', uncommittedEvents);
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
        
        it('it should be passing event to saga', function(done) {
            // then
            sagaHandler.stream.once('done', function(uncommittedEvents) {
                expect(uncommittedEvents[0].payload.setMe).to.eql('bimbimbim');
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