var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../../lib/definitionBase'),
  BusinessRule = require('../../lib/definitions/businessRule'),
  BusinessRuleError = require('../../lib/errors/businessRuleError'),
  api = require('../../');

describe('business rule definition', function () {

  describe('creating a new business rule definition', function () {

    describe('without any arguments', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineBusinessRule();
        }).to.throwError(/function/);

      });

    });

    describe('without business rule function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineBusinessRule(null);
        }).to.throwError(/function/);

      });

    });

    describe('with a wrong business rule function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineBusinessRule(null, 'not a function');
        }).to.throwError(/function/);

      });

    });

    describe('with a correct business rule function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          api.defineBusinessRule(null, function () {});
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var brFn = function () {};
        var br = api.defineBusinessRule(null, brFn);
        expect(br).to.be.a(DefinitionBase);
        expect(br).to.be.a(BusinessRule);
        expect(br.businessRuleFn).to.eql(brFn);
        expect(br.description).to.eql(undefined);
        expect(br.priority).to.eql(Infinity);
        expect(br.definitions).to.be.an('object');
        expect(br.definitions.command).to.be.an('object');
        expect(br.definitions.event).to.be.an('object');
        expect(br.defineCommand).to.be.a('function');
        expect(br.defineEvent).to.be.a('function');
        expect(br.defineOptions).to.be.a('function');

        expect(br.check).to.be.a('function');

      });

    });

    describe('with some meta infos and a correct business rule function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          api.defineBusinessRule({ priority: 3, description: 'bla bla bla' }, function () {});
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var brFn = function () {};
        var br = api.defineBusinessRule({ priority: 3, description: 'bla bla bla' }, brFn);
        expect(br).to.be.a(DefinitionBase);
        expect(br).to.be.a(BusinessRule);
        expect(br.businessRuleFn).to.eql(brFn);
        expect(br.description).to.eql('bla bla bla');
        expect(br.priority).to.eql(3);
        expect(br.definitions).to.be.an('object');
        expect(br.definitions.command).to.be.an('object');
        expect(br.definitions.event).to.be.an('object');
        expect(br.defineCommand).to.be.a('function');
        expect(br.defineEvent).to.be.a('function');
        expect(br.defineOptions).to.be.a('function');

        expect(br.check).to.be.a('function');

      });

    });
    
    describe('calling check', function () {
      
      describe('having defined a business rule function that', function () {
        
        describe('does not use a callback', function () {
          
          describe('having no error', function () {

            it('it should callback as expected', function (done) {

              var brFn = function (changed, previous, events, command) {};
              var br = api.defineBusinessRule({ priority: 3, description: 'bla bla bla' }, brFn);

              br.check({ changed: 'changed' }, { previous: 'previous' }, [{ evt: 'evt1' }], { cmd: 'cmd1' }, function (err) {
                expect(err).not.to.be.ok();
                done();
              });

            });

          });
          
          describe('but throws an error with message', function () {

            it('it should callback as expected', function (done) {

              var brFn = function (changed, previous, events, command) {
                throw new Error('errorMsg');
              };
              var br = api.defineBusinessRule({ priority: 3, description: 'bla bla bla' }, brFn);

              br.check({ changed: 'changed' }, { previous: 'previous' }, [{ evt: 'evt1' }], { cmd: 'cmd1' }, function (err) {
                expect(err).to.be.a(BusinessRuleError);
                expect(err.message).to.eql('errorMsg');
                done();
              });

            });

          });
          
          describe('but throws an error without message', function () {

            it('it should callback as expected', function (done) {

              var brFn = function (changed, previous, events, command) {
                throw new Error();
              };
              var br = api.defineBusinessRule({ priority: 3, description: 'bla bla bla' }, brFn);

              br.check({ changed: 'changed' }, { previous: 'previous' }, [{ evt: 'evt1' }], { cmd: 'cmd1' }, function (err) {
                expect(err).to.be.a(BusinessRuleError);
                expect(err.message).to.eql('bla bla bla');
                done();
              });

            });
            
          });

          describe('but returns an error', function () {
            
            describe('as error with message', function () {

              it('it should callback as expected', function (done) {

                var brFn = function (changed, previous, events, command) {
                  return new Error('errorMsg');
                };
                var br = api.defineBusinessRule({ priority: 3, description: 'bla bla bla' }, brFn);

                br.check({ changed: 'changed' }, { previous: 'previous' }, [{ evt: 'evt1' }], { cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('errorMsg');
                  done();
                });

              });

            });

            describe('as error without message', function () {

              it('it should callback as expected', function (done) {

                var brFn = function (changed, previous, events, command) {
                  return new Error();
                };
                var br = api.defineBusinessRule({ priority: 3, description: 'bla bla bla' }, brFn);

                br.check({ changed: 'changed' }, { previous: 'previous' }, [{ evt: 'evt1' }], { cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('bla bla bla');
                  done();
                });

              });

            });

            describe('as string', function () {
              
              it('it should callback as expected', function (done) {

                var brFn = function (changed, previous, events, command) {
                  return 'errorMsg'
                };
                var br = api.defineBusinessRule({ priority: 3, description: 'bla bla bla' }, brFn);

                br.check({ changed: 'changed' }, { previous: 'previous' }, [{ evt: 'evt1' }], { cmd: 'cmd1' }, function (err) {
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

              var brFn = function (changed, previous, events, command, callback) { callback(null); };
              var br = api.defineBusinessRule({ priority: 3, description: 'bla bla bla' }, brFn);

              br.check({ changed: 'changed' }, { previous: 'previous' }, [{ evt: 'evt1' }], { cmd: 'cmd1' }, function (err) {
                expect(err).not.to.be.ok();
                done();
              });

            });

          });

          describe('that callbacks with', function () {

            describe('as error with message', function () {

              it('it should callback as expected', function (done) {

                var brFn = function (changed, previous, events, command, callback) {
                  callback(new Error('errorMsg'));
                };
                var br = api.defineBusinessRule({ priority: 3, description: 'bla bla bla' }, brFn);

                br.check({ changed: 'changed' }, { previous: 'previous' }, [{ evt: 'evt1' }], { cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('errorMsg');
                  done();
                });

              });

            });

            describe('as error without message', function () {

              it('it should callback as expected', function (done) {

                var brFn = function (changed, previous, events, command, callback) {
                  callback(new Error());
                };
                var br = api.defineBusinessRule({ priority: 3, description: 'bla bla bla' }, brFn);

                br.check({ changed: 'changed' }, { previous: 'previous' }, [{ evt: 'evt1' }], { cmd: 'cmd1' }, function (err) {
                  expect(err).to.be.a(BusinessRuleError);
                  expect(err.message).to.eql('bla bla bla');
                  done();
                });

              });

            });

            describe('as string', function () {

              it('it should callback as expected', function (done) {

                var brFn = function (changed, previous, events, command, callback) {
                  callback('errorMsg');
                };
                var br = api.defineBusinessRule({ priority: 3, description: 'bla bla bla' }, brFn);

                br.check({ changed: 'changed' }, { previous: 'previous' }, [{ evt: 'evt1' }], { cmd: 'cmd1' }, function (err) {
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
