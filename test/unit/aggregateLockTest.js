var expect = require('expect.js'),
  async = require('async'),
  aggregatelock = require('../../lib/lock'),
  Base = require('../../lib/lock/base'),
  InMemory = require('../../lib/lock/databases/inmemory');

describe('AggregateLock', function() {

  it('it should have the correct interface', function() {

    expect(aggregatelock).to.be.an('object');
    expect(aggregatelock.create).to.be.a('function');
    expect(aggregatelock.Lock).to.eql(Base);

  });

  describe('calling create', function() {

    describe('without options', function() {

      it('it should return with the in memory queue', function() {

        var lock = aggregatelock.create();
        expect(lock).to.be.a('object');

      });

      describe('but with a callback', function() {

        it('it should callback with lock object', function(done) {

          aggregatelock.create(function(err, lock) {
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
          aggregatelock.create({ type: 'strangeDb' });
        }).to.throwError();

      });

      it('it should callback with an error', function(done) {

        expect(function() {
          aggregatelock.create({ type: 'strangeDb' }, function(err) {
            expect(err).to.be.ok();
            done();
          });
        }).to.throwError();

      });

    });

    describe('with options of an own db implementation', function() {

      it('it should return with the an instance of that implementation', function() {

        var lock = aggregatelock.create({ type: InMemory });
        expect(lock).to.be.a(InMemory);

      });

    });

    describe('with options containing a type property with the value of', function() {

      var types = ['inmemory', 'mongodb', 'tingodb', 'redis', 'couchdb'/*, 'azuretable'*/];

      types.forEach(function(type) {

        describe('"' + type + '"', function() {

          var lock;

          describe('without callback', function() {

            afterEach(function(done) {
              lock.disconnect(done);
            });

            it('it should return with the correct lock', function() {

              lock = aggregatelock.create({ type: type });
              expect(lock).to.be.a('object');
              expect(lock).to.be.a(Base);
              expect(lock.connect).to.be.a('function');
              expect(lock.disconnect).to.be.a('function');
              expect(lock.getNewId).to.be.a('function');
              expect(lock.reserve).to.be.a('function');
              expect(lock.getAll).to.be.a('function');
              expect(lock.resolve).to.be.a('function');

            });

          });

          describe('with callback', function() {

            afterEach(function(done) {
              lock.disconnect(done);
            });

            it('it should return with the correct lock', function(done) {

              aggregatelock.create({ type: type }, function(err, resL) {
                expect(err).not.to.be.ok();
                lock = resL;
                expect(lock).to.be.a('object');
                done();
              });

            });

          });

          describe('calling connect', function () {

            afterEach(function(done) {
              lock.disconnect(done);
            });

            describe('with a callback', function () {

              it('it should callback successfully', function(done) {

                lock = aggregatelock.create({ type: type });
                lock.connect(function (err) {
                  expect(err).not.to.be.ok();
                  done();
                })

              });

            });

            describe('without a callback', function () {

              it('it should emit connect', function(done) {

                lock = aggregatelock.create({ type: type });
                lock.once('connect', done);
                lock.connect()

              });

            });

          });

          describe('having connected', function() {

            describe('calling disconnect', function() {

              beforeEach(function(done) {
                lock = aggregatelock.create({ type: type });
                lock.connect(done);
              });

              it('it should callback successfully', function(done) {

                lock.disconnect(function(err) {
                  expect(err).not.to.be.ok();
                  done();
                });

              });

              it('it should emit disconnect', function(done) {

                lock.once('disconnect', done);
                lock.disconnect();

              });

            });

            describe('using the lock', function() {

              before(function(done) {
                lock = aggregatelock.create({ type: type });
                lock.connect(done);
              });

              describe('calling getNewId', function() {

                it('it should callback with a new Id as string', function(done) {

                  lock.getNewId(function(err, id) {
                    expect(err).not.to.be.ok();
                    expect(id).to.be.a('string');
                    done();
                  });

                });

              });

              describe('having no entries', function() {

                before(function(done) {
                  lock.clear(done);
                });

                describe('calling getAll', function() {

                  it('it should callback with an empty array', function(done) {

                    lock.getAll('23', function(err, items) {
                      expect(err).not.to.be.ok();
                      expect(items).to.be.an('array');
                      expect(items).to.have.length(0);
                      done();
                    });

                  });

                });

                describe('calling resolve', function(done) {

                  it('it should callback correctly', function(done) {

                    lock.resolve('23', function(err, nothing) {
                      expect(err).not.to.be.ok();
                      expect(nothing).to.eql(undefined);
                      done();
                    });

                  });

                });

                describe('calling reserve', function(done) {

                  it('it should callback with no error', function(done) {

                    lock.reserve('workerId1', 'aggregateId1', function(err, nothing) {
                      expect(err).not.to.be.ok();
                      expect(nothing).to.eql(undefined);
                      done();
                    });

                  });

                  describe('verifying if the reservation is ok, by calling getAll', function () {

                    it('it should callback the correct items', function (done) {

                      lock.getAll('aggregateId1', function (err, workerIds) {
                        expect(err).not.to.be.ok();
                        expect(workerIds).to.be.an('array');
                        expect(workerIds.length).to.eql(1);
                        expect(workerIds[0]).to.eql('workerId1');
                        done();
                      });

                    });

                  });

                });

              });

              describe('having 3 reservations for an aggregate and 2 reservations with an other aggregate', function() {

                beforeEach(function (done) {
                  lock.clear(function () {
                    async.series([
                      function (callback) {
                        setTimeout(function () {
                          lock.reserve('workerId111', 'aggregateId111', callback);
                        }, 1);
                      },
                      function (callback) {
                        setTimeout(function () {
                          lock.reserve('workerId222', 'aggregateId111', callback);
                        }, 2);
                      },
                      function (callback) {
                        setTimeout(function () {
                          lock.reserve('workerId333', 'aggregateId111', callback);
                        }, 3);
                      },
                      function (callback) {
                        setTimeout(function () {
                          lock.reserve('workerIdFirst', 'aggregateIdSecond', callback);
                        }, 4);
                      },
                      function (callback) {
                        setTimeout(function () {
                          lock.reserve('workerIdSecond', 'aggregateIdSecond', callback);
                        }, 5);
                      }
                    ], done);
                  });
                });

                describe('calling getAll of the first aggregate', function () {

                  it('it should callback with the correct amount of workers', function (done) {

                    lock.getAll('aggregateId111', function (err, workerIds) {
                      expect(err).not.to.be.ok();
                      expect(workerIds).to.be.an('array');
                      expect(workerIds.length).to.eql(3);
                      expect(workerIds[0]).to.eql('workerId111');
                      expect(workerIds[1]).to.eql('workerId222');
                      expect(workerIds[2]).to.eql('workerId333');
                      done();
                    });
                  });

                });

                describe('calling getAll of the second aggregate', function () {

                  it('it should callback with the correct amount of workers', function (done) {

                    lock.getAll('aggregateIdSecond', function (err, workerIds) {
                      expect(err).not.to.be.ok();
                      expect(workerIds).to.be.an('array');
                      expect(workerIds.length).to.eql(2);
                      expect(workerIds[0]).to.eql('workerIdFirst');
                      expect(workerIds[1]).to.eql('workerIdSecond');
                      done();
                    });
                  });

                });

                describe('calling resolve of the first aggregate', function() {

                  it('it should have removed all reservation for this aggregate', function (done) {

                    lock.resolve('aggregateId111', function (err, nothing) {
                      expect(err).not.to.be.ok();
                      expect(nothing).to.eql(undefined);

                      lock.getAll('aggregateId111', function (err, workerIds) {
                        expect(err).not.to.be.ok();
                        expect(workerIds).to.be.an('array');
                        expect(workerIds.length).to.eql(0);
                        done();
                      })
                    })

                  });

                  it('it should not have removed any reservation for the other aggregate', function (done) {

                    lock.resolve('aggregateId111', function (err, nothing) {
                      expect(err).not.to.be.ok();
                      expect(nothing).to.eql(undefined);

                      lock.getAll('aggregateIdSecond', function (err, workerIds) {
                        expect(err).not.to.be.ok();
                        expect(workerIds).to.be.an('array');
                        expect(workerIds.length).to.eql(2);
                        expect(workerIds[0]).to.eql('workerIdFirst');
                        expect(workerIds[1]).to.eql('workerIdSecond');
                        done();
                      })
                    })

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
