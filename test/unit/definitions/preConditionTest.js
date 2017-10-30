var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../../../lib/definitionBase'),
  PreCondition = require('../../../lib/definitions/preCondition'),
  BusinessRuleError = require('../../../lib/errors/businessRuleError'),
  api = require('../../../');

describe('pre-condition definition', function () {

  describe('creating a new pre-condition definition', function () {

    describe('without any arguments', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.definePreCondition();
        }).to.throwError(/function/);

      });

    });

    describe('without pre-condition function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.definePreCondition(null);
        }).to.throwError(/function/);

      });

    });

    describe('with a wrong pre-condition function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.definePreCondition(null, 'not a function');
        }).to.throwError(/function/);

      });

    });

    describe('with a correct pre-condition function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          api.definePreCondition(null, function () {});
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var pcFn = function () {};
        var pc = api.definePreCondition(null, pcFn);
        expect(pc).to.be.a(DefinitionBase);
        expect(pc).to.be.a(PreCondition);
        expect(pc.preConditionFn).to.eql(pcFn);
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
          var pc = api.definePreCondition({
            version: 0
          }, pcFn);
          expect(pc).to.be.a(DefinitionBase);
          expect(pc).to.be.a(PreCondition);
          expect(pc.preConditionFn).to.eql(pcFn);
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

    describe('with some meta infos and a correct pre-condition function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          api.definePreCondition({ priority: 3, description: 'bla bla bla' }, function () {});
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var pcFn = function () {};
        var pc = api.definePreCondition({ priority: 3, description: 'bla bla bla' }, pcFn);
        expect(pc).to.be.a(DefinitionBase);
        expect(pc).to.be.a(PreCondition);
        expect(pc.preConditionFn).to.eql(pcFn);
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

      describe('having defined a pre-condition function that', function () {

        describe('does not use a callback', function () {

          describe('having no error', function () {

            it('it should callback as expected', function (done) {

              var cmdOk = false;
              var pcFn = function (command, agg) {
                cmdOk = command.changed === 'changed';
                expect(command.changed, 'changed');
              };
              var pc = api.definePreCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

              pc.check({ changed: 'changed' }, { cmd: 'cmd1' }, function (err) {
                expect(err).not.to.be.ok();
                expect(cmdOk).to.eql(true);
                done();
              });

            });

          });

          describe('but throws an error with message', function () {

            it('it should callback as expected', function (done) {

              var cmdOk = false;
              var pcFn = function (command, agg) {
                cmdOk = command.changed === 'changed';
                throw new Error('errorMsg');
              };
              var pc = api.definePreCondition({ priority: 3, description: 'bla bla bla', payload: 'deep' }, pcFn);

              pc.check({ deep: { changed: 'changed' } }, { cmd: 'cmd1' }, function (err) {
                expect(err).to.be.a(BusinessRuleError);
                expect(err.message).to.eql('errorMsg');
                expect(cmdOk).to.eql(true);
                done();
              });

            });

          });

          describe('but throws an error without message', function () {

            it('it should callback as expected', function (done) {

              var pcFn = function (agg, command) {
                throw new Error();
              };
              var pc = api.definePreCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

              pc.check({ changed: 'changed' }, { cmd: 'cmd1' }, function (err) {
                expect(err).to.be.a(BusinessRuleError);
                expect(err.message).to.eql('bla bla bla');
                done();
              });

            });

          });

          describe('but throws a BusinessRuleError with more', function () {

            it('it should callback as expected', function (done) {

              var pcFn = function (agg, command) {
                throw new BusinessRuleError('my message', 'more stuff');
              };
              var pc = api.definePreCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

              pc.check({ changed: 'changed' }, { cmd: 'cmd1' }, function (err) {
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

                var pcFn = function (agg, command) {
                  return new Error('errorMsg');
                };
                var pc = api.definePreCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ changed: 'changed' }, { cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('errorMsg');
                  done();
                });

              });

            });

            describe('as error without message', function () {

              it('it should callback as expected', function (done) {

                var pcFn = function (agg, command) {
                  return new Error();
                };
                var pc = api.definePreCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ changed: 'changed' }, { cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('bla bla bla');
                  done();
                });

              });

            });

            describe('as string', function () {

              it('it should callback as expected', function (done) {

                var pcFn = function (agg, command) {
                  return 'errorMsg'
                };
                var pc = api.definePreCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ changed: 'changed' }, { cmd: 'cmd1' }, function (err) {
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

              var pcFn = function (agg, command, callback) { callback(null); };
              var pc = api.definePreCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

              pc.check({ changed: 'changed' }, { cmd: 'cmd1' }, function (err) {
                expect(err).not.to.be.ok();
                done();
              });

            });

          });

          describe('that callbacks with', function () {

            describe('as error with message', function () {

              it('it should callback as expected', function (done) {

                var pcFn = function (agg, command, callback) {
                  callback(new Error('errorMsg'));
                };
                var pc = api.definePreCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ changed: 'changed' }, { cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('errorMsg');
                  done();
                });

              });

            });

            describe('as BusinessRuleError with more', function () {

              it('it should callback as expected', function (done) {

                var pcFn = function (agg, command, callback) {
                  callback(new BusinessRuleError('errorMsg', 'moreStuff'));
                };
                var pc = api.definePreCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ changed: 'changed' }, { cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('errorMsg');
                  expect(err.more).to.eql('moreStuff');
                  done();
                });

              });

            });

            describe('as error without message', function () {

              it('it should callback as expected', function (done) {

                var pcFn = function (agg, command, callback) {
                  callback(new Error());
                };
                var pc = api.definePreCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ changed: 'changed' }, { cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('bla bla bla');
                  done();
                });

              });

            });

            describe('as string', function () {

              it('it should callback as expected', function (done) {

                var pcFn = function (agg, command, callback) {
                  callback('errorMsg');
                };
                var pc = api.definePreCondition({ priority: 3, description: 'bla bla bla' }, pcFn);

                pc.check({ changed: 'changed' }, { cmd: 'cmd1' }, function (err) {
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
