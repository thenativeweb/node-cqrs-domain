var expect = require('expect.js'),
    domain = require('../../index').domain;

describe('Domain', function() {

    var dummyEmitter = new (require('events').EventEmitter)();

    before(function(done) {

        domain.on('event', function(evt) {
            dummyEmitter.emit('published', evt);
        });
        domain.initialize({
            commandHandlersPath: __dirname + '/commandHandlers',
            aggregatesPath: __dirname + '/aggregates',
            sagaHandlersPath: __dirname + '/sagaHandlers',
            sagasPath: __dirname + '/sagas',
            commandLock: { type: 'inMemory', collectionName: 'commandlock' },
            disableQueuing: true
        }, done);

    });

    describe('noting a command', function() {

        describe('having well-formed data', function() {

            describe('having any command handlers', function() {

                describe('having bad data', function() {

                    it('it should acknowledge the command', function(done) {

                        var cmd = 'foobar';
                        domain.handle(cmd, function(err) {
                            expect(err).not.to.be.ok();
                            done();
                        });

                    });

                });

                describe('having a command thant no command handler listens to', function() {

                    it('it should acknowledge the command', function(done) {

                        var cmd = {
                            command: 'foobar',
                            id: '82517'
                        };
                        domain.handle(cmd, function(err) {
                            expect(err).not.to.be.ok();
                            done();
                        });

                    });

                });

                it('it should acknowledge the command', function(done) {

                    var cmd = {
                        command: 'foobar',
                        id: '82517'
                    };
                    domain.handle(cmd, function(err) {
                        expect(err).not.to.be.ok();
                        done();
                    });

                });

                it('it should publish an event', function(done) {

                    var cmd = {
                        command: 'changeDummy',
                        id: '82517'
                    };

                    dummyEmitter.once('published', function(evt) {
                        expect(evt.event).to.eql('dummyChanged');
                        expect(evt.commandId).to.eql(cmd.id);
                        done();
                    });

                    domain.handle(cmd, function(err) {});

                });

                describe('when the underlying aggregate has been destroyed', function() {

                    var cmd = {
                        command: 'changeDummy',
                        id: '12345',
                        payload: {
                            id: '82517'
                        }
                    };
                    
                    beforeEach(function(done) {

                        dummyEmitter.once('published', function(evt) {
                            done();
                        });

                        domain.handle({
                            command: 'destroyDummy',
                            payload: {
                                id: '82517'
                            }
                        }, function() {});

                    });

                    it('it should raise a commandRejected event', function(done) {

                        dummyEmitter.once('published', function(evt) {
                            expect(evt.event).to.eql('commandRejected');
                            expect(evt.commandId).to.eql(cmd.id);
                            expect(evt.payload.reason.name).to.eql('AggregateDestroyed');
                            expect(evt.payload.reason.aggregateRevision).to.eql(1);
                            expect(evt.payload.reason.aggregateId).to.eql('82517');
                            done();
                        });

                        domain.handle(cmd, function(err) {});

                    });

                });

                describe('when sending multiple commands together', function() {

                    var cmd1 = {
                        command: 'changeDummy',
                        id: '123455',
                        payload: {
                            id: '12382517'
                        }
                    };

                    var cmd2 = {
                        command: 'changeDummy',
                        id: '23455789',
                        payload: {
                            id: '12382517'
                        }
                    };

                    var cmd3 = {
                        command: 'changeDummy',
                        id: '2312345789',
                        payload: {
                            id: '12382517'
                        }
                    };

                    it('it should set revision correctly', function(done) {

                        var count = 0;
                        var handle;
                        dummyEmitter.on('published', handle = function(evt) {
                            count++;
                            if (count === 3) {
                                expect(evt.head.revision).to.eql(3);
                                dummyEmitter.removeListener('published', handle);
                                done();
                            }
                        });

                        domain.handle(cmd1, function(err) {});
                        domain.handle(cmd2, function(err) {});
                        domain.handle(cmd3, function(err) {});

                    });

                });

            });

            describe('working with versioned messages', function() {

                it('it should work as expected', function(done) {

                    var cmd = {
                        head: {
                            version: 1
                        },
                        command: 'versionedCmd',
                        id: '9991111828283',
                        payload: {
                            id: '19283464819238',
                            haha: 'versioned'
                        }
                    };

                    var called = false;
                    dummyEmitter.once('published', function(evt) {
                        expect(called).to.be.ok();
                        expect(evt.head.version).to.be(1);

                        done();
                    });
                    domain.handle(cmd, function(err) {
                        called = true;
                        expect(err).not.to.be.ok();
                    });

                });

                describe('not setting the version', function() {

                    it('it should work as expected', function(done) {

                        var cmd = {
                            command: 'versionedCmd',
                            id: '9991111828283',
                            payload: {
                                id: '19283464819238',
                                haha: 'versioned'
                            }
                        };

                        var called = false;
                        dummyEmitter.once('published', function(evt) {
                            expect(called).to.be.ok();
                            expect(evt.head.version).to.be(undefined);

                            done();
                        });
                        domain.handle(cmd, function(err) {
                            called = true;
                            expect(err).not.to.be.ok();
                        });

                    });

                });

            });

            describe('having a command handler that sends commands to other command handlers', function() {

                it('it should acknowledge the command', function(done) {

                    var cmd = {
                        command: 'fooIt',
                        id: '82517',
                        payload: {
                            haha: 'hihi'
                        }
                    };

                    var called = false;
                    dummyEmitter.once('published', function(evt) {
                        expect(called).to.be.ok();
                        done();
                    });
                    domain.handle(cmd, function(err) {
                        called = true;
                        expect(err).not.to.be.ok();
                    });

                });

                it('it should publish an event', function(done) {

                    var cmd = {
                        command: 'fooIt',
                        id: '82517',
                        payload: {
                            haha: 'hihi'
                        }
                    };

                    var fooItedReceived = false,
                        fooCretedReceived = false;

                    function finish(evt) {
                        if (fooItedReceived && fooCretedReceived) {
                            return;
                        }
                        if (evt.event === 'fooIted') {
                            fooItedReceived = true;
                        } else if (evt.event === 'fooCreated') {
                            fooCretedReceived = true;
                        }

                        if (fooItedReceived && fooCretedReceived) {
                            done();
                        }
                    }

                    dummyEmitter.on('published', function(evt) {
                        finish(evt);
                    });

                    domain.handle(cmd, function(err) {});

                });

            });

            describe('simulating mutliple process handling the same aggregate instance', function() {

                var cmdHandle = require('./commandHandlers/dummyCommandHandler'),
                    orgHandle;

                before(function() {
                    orgHandle = cmdHandle.handle;
                    cmdHandle.handle = cmdHandle._handle;
                });

                after(function() {
                    cmdHandle.handle = orgHandle;
                });

                describe('sending multiple commands together', function() {

                    var cmd1 = {
                        command: 'changeDummy',
                        id: '1234552',
                        payload: {
                            id: '123825172'
                        }
                    };

                    var cmd2 = {
                        command: 'changeDummy',
                        id: '234557892',
                        payload: {
                            id: '123825172'
                        }
                    };

                    var cmd3 = {
                        command: 'changeDummy',
                        id: '23123457892',
                        payload: {
                            id: '123825172'
                        }
                    };

                    it('it should set revision correctly', function(done) {

                        var count = 0;
                        var handle;
                        dummyEmitter.on('published', handle = function(evt) {
                            count++;
                            if (count === 3) {
                                expect(evt.head.revision).to.eql(3);
                                dummyEmitter.removeListener('published', handle);
                                done();
                            }
                        });

                        domain.handle(cmd1, function(err) {});
                        domain.handle(cmd2, function(err) {});
                        domain.handle(cmd3, function(err) {});

                    });

                });

            });

        });
            
    });

    describe('having any saga handlers', function() {

        describe('noting an expected event', function() {

            it('it should emit an other event', function(done) {

                var cmd = {
                    command: 'cancelDummy',
                    id: '825171111'
                };

                dummyEmitter.on('published', function(evt) {
                    if (evt.event === 'dummyDestroyed') {
                        done();
                    }
                });

                domain.handle(cmd, function(err) {});

            });

        });

    });


});