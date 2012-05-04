var expect = require('expect.js')
  , EventEmitter = require('events').EventEmitter
  , commandHandlerBase = require('../index').commandHandlerBase
  , aggregateBase = require('../index').aggregateBase;

var stream = new EventEmitter();

var Aggregate = aggregateBase.extend({

    doSomethingCommand: function(data, callback) {
        this.apply(this.toEvent('SomethingDoneEvent', data), callback);
    },

    SomethingDoneEvent: function(data) {
        this.set(data);
    }, 

    validate: function(ruleName, data, callback) {
       callback();
    }
});
var aggregate = new Aggregate('id_1');
aggregate.set({revision: 0});


var commandHandler = commandHandlerBase.extend({
    commands: ['doSomethingCommand'],
    aggregate: 'overridden load!',

    stream: stream,

    loadAggregate: function(id, callback) {
        this.aggregate = aggregate;

        callback(null, this.aggregate, this.stream);
    },

    commit: function(cmdId, uncommittedEvents, stream, callback) {
        var self = this;

        stream.uncommittedEvents = uncommittedEvents;
        stream.emit('done', uncommittedEvents);
    }
});


describe('CommandHandlerBase', function() {

    describe('calling handle function', function() {

        // given 
        var command = {
            command: 'doSomethingCommand',
            payload: {
                setMe: 'should be set on aggregate'
            }
        };
        
        it('it should be passing command to aggregate and given back an event', function(done) {
            // then
            commandHandler.stream.on('done', function(uncommittedEvents) {
                expect(uncommittedEvents[0].payload.setMe).to.eql('should be set on aggregate');
                done();
            });

            // when
            commandHandler.handle('id_1', command);
        });

    });

});