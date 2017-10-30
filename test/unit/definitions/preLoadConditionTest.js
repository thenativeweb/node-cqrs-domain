var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../../../lib/definitionBase'),
  PreLoadCondition = require('../../../lib/definitions/preLoadCondition'),
  BusinessRuleError = require('../../../lib/errors/businessRuleError'),
  api = require('../../../');

describe('pre-load-condition definition', function () {

  describe('creating a new pre-load-condition definition', function () {

    describe('without any arguments', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.definePreLoadCondition();
        }).to.throwError(/function/);

      });

    });

    describe('without pre-load-condition function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.definePreLoadCondition(null);
        }).to.throwError(/function/);

      });

    });

    describe('with a wrong pre-load-condition function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.definePreLoadCondition(null, 'not a function');
        }).to.throwError(/function/);

      });

    });

    describe('with a correct pre-load-condition function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          api.definePreLoadCondition(null, function () {});
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var pcFn = function () {};
        var pc = api.definePreLoadCondition(null, pcFn);
        expect(pc).to.be.a(DefinitionBase);
        expect(pc).to.be.a(PreLoadCondition);
        expect(pc.preLoadConditionFn).to.eql(pcFn);
        expect(pc.description).to.eql(undefined);
        expect(pc.version).to.eql(undefined);
        expect(pc.priority).to.eql(Infinity);
        expect(pc.payload).to.eql(null);
        expect(pc.definitions).to.be.an('object');
        expect(pc.definitions.command).to.be.an('object');
        expect(pc.definitions.event).to.be.an('object');
        expect(pc.defineCommand).to.be.a('function');
        expect(pc.defineEvent).to.be.a('function');
        expect(pc.defineOptions).to.be.a('function');

        expect(pc.check).to.be.a('function');

      });

      describe('with a defined version', function () {

        it('it should return a correct object', function () {

          var pcFn = function () {};
          var pc = api.definePreLoadCondition({ version: 0 }, pcFn);
          expect(pc).to.be.a(DefinitionBase);
          expect(pc).to.be.a(PreLoadCondition);
          expect(pc.preLoadConditionFn).to.eql(pcFn);
          expect(pc.description).to.eql(undefined);
          expect(pc.version).to.eql(0);
          expect(pc.priority).to.eql(Infinity);
          expect(pc.payload).to.eql(null);
          expect(pc.definitions).to.be.an('object');
          expect(pc.definitions.command).to.be.an('object');
          expect(pc.definitions.event).to.be.an('object');
          expect(pc.defineCommand).to.be.a('function');
          expect(pc.defineEvent).to.be.a('function');
          expect(pc.defineOptions).to.be.a('function');

          expect(pc.check).to.be.a('function');

        });

      });

    });

    describe('with some meta infos and a correct pre-load-condition function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          api.definePreLoadCondition({ priority: 3, description: 'bla bla bla' }, function () {});
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var pcFn = function () {};
        var pc = api.definePreLoadCondition({ priority: 3, description: 'bla bla bla' }, pcFn);
        expect(pc).to.be.a(DefinitionBase);
        expect(pc).to.be.a(PreLoadCondition);
        expect(pc.preLoadConditionFn).to.eql(pcFn);
        expect(pc.description).to.eql('bla bla bla');
        expect(pc.version).to.eql(undefined);
        expect(pc.priority).to.eql(3);
        expect(pc.payload).to.eql(null);
        expect(pc.definitions).to.be.an('object');
        expect(pc.definitions.command).to.be.an('object');
        expect(pc.definitions.event).to.be.an('object');
        expect(pc.defineCommand).to.be.a('function');
        expect(pc.defineEvent).to.be.a('function');
        expect(pc.defineOptions).to.be.a('function');

        expect(pc.check).to.be.a('function');

      });

    });

    describe('calling check', function () {

      describe('having defined a pre-load-condition function that', function () {

        describe('does not use a callback', function () {

          describe('having no error', function () {

            it('it should callback as expected', function (done) {

              var cmdOk = false;
              var pcFn = function (command) {
                cmdOk = command.cmd === 'cmd1'
              };
              var pc = api.definePreLoadCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

              pc.check({ cmd: 'cmd1' }, function (err) {
                expect(err).not.to.be.ok();
                expect(cmdOk).to.eql(true);
                done();
              });

            });

          });

          describe('but throws an error with message', function () {

            it('it should callback as expected', function (done) {

              var cmdOk = false;
              var pcFn = function (command) {
                cmdOk = command.test === 'payload'
                throw new Error('errorMsg');
              };
              var pc = api.definePreLoadCondition({ priority: 3, description: 'bla bla bla', payload: 'deep' }, pcFn);

              pc.check({ cmd: 'cmd1', deep: {test: 'payload'} }, function (err) {
                expect(err).to.be.a(BusinessRuleError);
                expect(err.message).to.eql('errorMsg');
                expect(cmdOk).to.eql(true);
                done();
              });

            });

          });

          describe('but throws an error without message', function () {

            it('it should callback as expected', function (done) {

              var pcFn = function (command) {
                throw new Error();
              };
              var pc = api.definePreLoadCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

              pc.check({ cmd: 'cmd1' }, function (err) {
                expect(err).to.be.a(BusinessRuleError);
                expect(err.message).to.eql('bla bla bla');
                done();
              });

            });

          });

          describe('but throws a BusinessRuleError with more', function () {

            it('it should callback as expected', function (done) {

              var pcFn = function (command) {
                throw new BusinessRuleError('my message', 'more stuff');
              };
              var pc = api.definePreLoadCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

              pc.check({ cmd: 'cmd1' }, function (err) {
                expect(err).to.be.a(BusinessRuleError);
                expect(err.message).to.eql('my message');
                expect(err.more).to.eql('more stuff');
                done();
              });

            });

          });

          describe('but returns an error', function () {

            describe('as error with message', function () {

              it('it should callback as expected', function (done) {

                var pcFn = function (command) {
                  return new Error('errorMsg');
                };
                var pc = api.definePreLoadCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('errorMsg');
                  done();
                });

              });

            });

            describe('as error without message', function () {

              it('it should callback as expected', function (done) {

                var pcFn = function (command) {
                  return new Error();
                };
                var pc = api.definePreLoadCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('bla bla bla');
                  done();
                });

              });

            });

            describe('as string', function () {

              it('it should callback as expected', function (done) {

                var pcFn = function (command) {
                  return 'errorMsg'
                };
                var pc = api.definePreLoadCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('errorMsg');
                  done();
                });

              });

            });

          });

        });

        describe('uses a callback', function () {

          describe('having no error', function () {

            it('it should callback as expected', function (done) {

              var pcFn = function (command, callback) { callback(null); };
              var pc = api.definePreLoadCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

              pc.check({ cmd: 'cmd1' }, function (err) {
                expect(err).not.to.be.ok();
                done();
              });

            });

          });

          describe('that callbacks with', function () {

            describe('as error with message', function () {

              it('it should callback as expected', function (done) {

                var pcFn = function (command, callback) {
                  callback(new Error('errorMsg'));
                };
                var pc = api.definePreLoadCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('errorMsg');
                  done();
                });

              });

            });

            describe('as BusinessRuleError with more', function () {

              it('it should callback as expected', function (done) {

                var pcFn = function (command, callback) {
                  callback(new BusinessRuleError('errorMsg', 'moreStuff'));
                };
                var pc = api.definePreLoadCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('errorMsg');
                  expect(err.more).to.eql('moreStuff');
                  done();
                });

              });

            });

            describe('as error without message', function () {

              it('it should callback as expected', function (done) {

                var pcFn = function (command, callback) {
                  callback(new Error());
                };
                var pc = api.definePreLoadCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('bla bla bla');
                  done();
                });

              });

            });

            describe('as string', function () {

              it('it should callback as expected', function (done) {

                var pcFn = function (command, callback) {
                  callback('errorMsg');
                };
                var pc = api.definePreLoadCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('errorMsg');
                  done();
                });

              });

            });

          });

        });

      });

    });

  });

});
