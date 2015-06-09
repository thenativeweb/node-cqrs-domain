var expect = require('expect.js'),
  async = require('async'),
  commandBumper = require('../../lib/bumper'),
  Base = require('../../lib/bumper/base'),
  InMemory = require('../../lib/bumper/databases/inmemory');

describe('CommandBumper', function() {

  it('it should have the correct interface', function() {

    expect(commandBumper).to.be.an('object');
    expect(commandBumper.create).to.be.a('function');
    expect(commandBumper.Bumper).to.eql(Base);

  });

  describe('calling create', function() {

    describe('without options', function() {

      it('it should return with the in memory queue', function() {

        var lock = commandBumper.create();
        expect(lock).to.be.a('object');

      });

      describe('but with a callback', function() {

        it('it should callback with lock object', function(done) {

          commandBumper.create(function(err, lock) {
            expect(err).not.to.be.ok();
            expect(lock).to.be.a('object');
            done();
          });

        });

      });

    });

    describe('with options of a non existing db implementation', function() {

      it('it should throw an error', function() {

        expect(function() {
          commandBumper.create({ type: 'strangeDb' });
        }).to.throwError();

      });

      it('it should callback with an error', function(done) {

        expect(function() {
          commandBumper.create({ type: 'strangeDb' }, function(err) {
            expect(err).to.be.ok();
            done();
          });
        }).to.throwError();

      });

    });

    describe('with options of an own db implementation', function() {

      it('it should return with the an instance of that implementation', function() {

        var bumper = commandBumper.create({ type: InMemory });
        expect(bumper).to.be.a(InMemory);

      });

    });

    describe('with options containing a type property with the value of', function() {

      var types = ['inmemory', 'mongodb', 'tingodb', 'redis'];

      types.forEach(function(type) {

        describe('"' + type + '"', function() {

          var bumper;

          describe('without callback', function() {

            afterEach(function(done) {
              bumper.disconnect(done);
            });

            it('it should return with the correct lock', function() {

              bumper = commandBumper.create({ type: type });
              expect(bumper).to.be.a('object');
              expect(bumper).to.be.a(Base);
              expect(bumper.connect).to.be.a('function');
              expect(bumper.disconnect).to.be.a('function');
              expect(bumper.getNewId).to.be.a('function');
              expect(bumper.add).to.be.a('function');

            });

          });

          describe('with callback', function() {

            afterEach(function(done) {
              bumper.disconnect(done);
            });

            it('it should return with the correct lock', function(done) {

              commandBumper.create({ type: type }, function(err, resL) {
                expect(err).not.to.be.ok();
                bumper = resL;
                expect(bumper).to.be.a('object');
                done();
              });

            });

          });

          describe('calling connect', function () {

            afterEach(function(done) {
              bumper.disconnect(done);
            });

            describe('with a callback', function () {

              it('it should callback successfully', function(done) {

                bumper = commandBumper.create({ type: type });
                bumper.connect(function (err) {
                  expect(err).not.to.be.ok();
                  done();
                })

              });

            });

            describe('without a callback', function () {

              it('it should emit connect', function(done) {

                bumper = commandBumper.create({ type: type });
                bumper.once('connect', done);
                bumper.connect()

              });

            });

          });

          describe('having connected', function() {

            describe('calling disconnect', function() {

              beforeEach(function(done) {
                bumper = commandBumper.create({ type: type });
                bumper.connect(done);
              });

              it('it should callback successfully', function(done) {

                bumper.disconnect(function(err) {
                  expect(err).not.to.be.ok();
                  done();
                });

              });

              it('it should emit disconnect', function(done) {

                bumper.once('disconnect', done);
                bumper.disconnect();

              });

            });

            describe('using the lock', function() {

              before(function(done) {
                bumper = commandBumper.create({ type: type, ttl: 1100 });
                bumper.connect(done);
              });

              describe('calling getNewId', function() {

                it('it should callback with a new Id as string', function(done) {

                  bumper.getNewId(function(err, id) {
                    expect(err).not.to.be.ok();
                    expect(id).to.be.a('string');
                    done();
                  });

                });

              });

              describe('having no entries', function() {

                before(function(done) {
                  bumper.clear(done);
                });

                describe('calling add', function() {

                  it('it should callback correctly', function(done) {

                    bumper.add('key1', 100, function(err, added) {
                      expect(err).not.to.be.ok();
                      expect(added).to.eql(true);
                      done();
                    });

                  });

                });

                describe('calling add with the an already added key', function() {

                  it('it should callback correctly', function(done) {

                    bumper.add('key2', 100, function(err, added) {
                      expect(err).not.to.be.ok();
                      expect(added).to.eql(true);

                      bumper.add('key2', 100, function(err, added) {
                        expect(err).not.to.be.ok();
                        expect(added).to.eql(false);
                        done();
                      });
                    });

                  });

                  describe('but waiting the expiration', function() {

                    it('it should callback correctly', function(done) {

                      bumper.add('key3', 50, function(err, added) {
                        expect(err).not.to.be.ok();
                        expect(added).to.eql(true);

                        setTimeout(function () {
                          bumper.add('key3', 50, function(err, added) {
                            expect(err).not.to.be.ok();
                            expect(added).to.eql(true);
                            done();
                          });
                        }, 1001);

                      });

                    });

                  });

                });

                describe('without passing a ttl calling add with the an already added key', function() {

                  it('it should callback correctly', function(done) {

                    bumper.add('key22', function(err, added) {
                      expect(err).not.to.be.ok();
                      expect(added).to.eql(true);

                      bumper.add('key22', function(err, added) {
                        expect(err).not.to.be.ok();
                        expect(added).to.eql(false);
                        done();
                      });
                    });

                  });

                  describe('but waiting the expiration', function() {

                    it('it should callback correctly', function(done) {

                      bumper.add('key23', function(err, added) {
                        expect(err).not.to.be.ok();
                        expect(added).to.eql(true);

                        setTimeout(function () {
                          bumper.add('key23', function(err, added) {
                            expect(err).not.to.be.ok();
                            expect(added).to.eql(true);
                            done();
                          });
                        }, 1501);

                      });

                    });

                  });

                });

              });

            });

          });

        });

      });

    });

  });

});
