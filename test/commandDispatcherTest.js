var expect = require('expect.js')
  , async = require('async')
  , commandDispatcher = require('../lib/commandDispatcher')
  , queue = require('node-queue')
  , commandQueue
  , eventEmitter = require('../lib/eventEmitter');

function cleanQueue(done) {
    commandQueue.getAll(function(err, cmds) {
        async.forEach(cmds, function(item, callback) {
            commandQueue.remove(item.id, callback);
        }, function(err) {
            if (!err) done();
        });
    });
}

describe('commandDispatcher', function() {

    before(function(done) {
        queue.connect(function(err, cmdQueue) {
            commandQueue = cmdQueue;
            commandDispatcher.configure(function() {
                this.use(commandQueue);
            });
            done();
        });
    });

    afterEach(function(done) {
        cleanQueue(done);
    });

    describe('calling initialize', function() {

        describe('having zero entries', function() {

            after(function() {
                // remove listeners as you connect in a second test again 
                // else you would call the dequeue function more than once 
                // as it is bound in initalize function
                eventEmitter.removeAllListeners('handled:*');
                eventEmitter.registered = {};
            });

            it('it should connect', function(done) {
                commandDispatcher.initialize({}, function(err) {
                    expect(err).not.to.be.ok();
                    done();
                });
            });

        });

        describe('having any entries', function() {

            var emitted = false;

            beforeEach(function(done) {
                eventEmitter.registered = {};
                eventEmitter.once('handle:changeDummy', function() { emitted = true; });
                eventEmitter.register('handle:changeDummy');

                // remove listeners as you connect in a second test again 
                // else you would call the dequeue function more than once 
                // as it is bound in initalize function
                eventEmitter.removeAllListeners('handled:*');

                commandQueue.push('cmdid', { id: 'cmdid', command: 'changeDummy' }, done);
            });

            it('it should connect', function(done) {
                commandDispatcher.initialize({}, function(err) {
                    expect(err).not.to.be.ok();
                    done();
                });
            });

            it('it should reemit the commands', function(done) {
                commandDispatcher.initialize({}, function(err) {
                    expect(emitted).to.eql(true);
                    done();
                });
            });

        });

    });

    describe('being initialized', function() {

        var command;

        before(function(done) {
            commandDispatcher.initialize(done);
        });

        beforeEach(function()
        {
            command = {
                id: 'cmdid', 
                command: 'changeDummy', 
                payload: { id: '1' } 
            };
        });

        describe('calling dispatch', function() {

            describe('having no commandhandler', function() {

                before(function() {
                    eventEmitter.registered = {};
                });

                it('it should callback with error', function(done) {
                    commandDispatcher.dispatch(command, function(err) {
                        expect(err).to.be.ok();
                        done();
                    });
                });

                it('it should not add a command to commandQueue', function(done) {
                    commandDispatcher.dispatch(command, function(err) {
                        commandQueue.getAll(function(err, items) {
                            expect(items).to.be.an('array');
                            expect(items).to.have.length(0);
                            done();
                        });
                    });
                });

            });
            
            describe('having a commandhandler', function() {

                beforeEach(function() {
                    eventEmitter.once('handle:changeDummy', function() {});
                    eventEmitter.register('handle:changeDummy');
                });

                it('it should callback with success', function(done) {
                    commandDispatcher.dispatch(command, function(err) {
                        expect(err).not.to.be.ok();
                        done();
                    });
                });

                it('the commandQueueStore should contain an entry', function(done) {
                    commandDispatcher.dispatch(command, function(err) {
                        commandQueue.getAll(function(err, items) { 
                            expect(items).to.be.an('array');
                            expect(items).to.have.length(1);
                            done();
                        });
                    });
                });

                describe('having no payload id', function() {

                    beforeEach(function() {
                        delete command.payload.id;
                    });

                    it('it should create a new id', function(done) {
                        commandDispatcher.dispatch(command, function(err) {
                            commandQueue.getAll(function(err, items) {
                                expect(items[0]).to.have.property('id');
                                done();
                            });
                        });

                    });

                    it('the commandQueueStore should contain an entry', function(done) {
                        commandDispatcher.dispatch(command, function(err) {
                            commandQueue.getAll(function(err, items) { 
                                expect(items).to.be.an('array');
                                expect(items).to.have.length(1);
                                done();
                            });
                        });
                    });

                });

                describe('having a command with already blocked aggregate', function() {

                    it('it should callback with error', function(done) {
                        commandDispatcher.dispatch(command, function(err) {
                            commandDispatcher.dispatch(command, function(err) {
                                expect(err).to.be.ok();
                                done();
                            });
                        });
                    });

                });

            });

        });

        describe('noting handled:* event being raised', function() {

            describe('on existing entry', function() {

                before(function(done) {
                    commandQueue.push('cmdid', { id: 'cmdid', command: 'changeDummy' }, done);
                });

                it('it should remove the entry', function(done) {
                    eventEmitter.emit('handled:changeDummy', 'cmdid', { id: 'cmdid', command: 'changeDummy'} );

                    commandQueue.getAll(function(err, entries) {
                        expect(entries).to.be.an('array');
                        expect(entries).to.have.length(0);
                        done();
                    });
                });

            });

            describe('on non existing entry', function() {

                it('it should not create an entry', function(done) {
                    eventEmitter.emit('handled:changeDummy', 'cmdid', { id: 'cmdid', command: 'changeDummy'} );

                    commandQueue.getAll(function(err, entries) {
                        expect(entries).to.be.an('array');
                        expect(entries).to.have.length(0);
                        done();
                    });
                });

            });

        });

    });

});