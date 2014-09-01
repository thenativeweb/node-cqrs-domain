var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../../../lib/definitionBase'),
  Command = require('../../../lib/definitions/command'),
  api = require('../../../');

describe('command definition', function () {

  describe('creating a new command definition', function () {

    describe('without any arguments', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineCommand();
        }).to.throwError(/function/);

      });

    });

    describe('without command function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineCommand(null);
        }).to.throwError(/function/);

      });

    });

    describe('with a wrong command function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineCommand(null, 'not a function');
        }).to.throwError(/function/);

      });

    });

    describe('with a correct command function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          api.defineCommand(null, function () {});
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var cmdFn = function () {};
        var cmd = api.defineCommand(null, cmdFn);
        expect(cmd).to.be.a(DefinitionBase);
        expect(cmd).to.be.a(Command);
        expect(cmd.cmdFn).to.eql(cmdFn);
        expect(cmd.version).to.eql(0);
        expect(cmd.payload).to.eql('');
        expect(cmd.definitions).to.be.an('object');
        expect(cmd.definitions.command).to.be.an('object');
        expect(cmd.definitions.event).to.be.an('object');
        expect(cmd.defineCommand).to.be.a('function');
        expect(cmd.defineEvent).to.be.a('function');
        expect(cmd.defineOptions).to.be.a('function');

        expect(cmd.defineValidation).to.be.a('function');
        expect(cmd.validate).to.be.a('function');
        expect(cmd.handle).to.be.a('function');

      });

    });

    describe('with some meta infos and a correct command function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          api.defineCommand({ version: 3, payload: 'some.path' }, function () {});
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var cmdFn = function () {};
        var cmd = api.defineCommand({ version: 3, payload: 'some.path' }, cmdFn);
        expect(cmd).to.be.a(DefinitionBase);
        expect(cmd).to.be.a(Command);
        expect(cmd.cmdFn).to.eql(cmdFn);
        expect(cmd.version).to.eql(3);
        expect(cmd.payload).to.eql('some.path');
        expect(cmd.options).to.be.an('object');
        expect(cmd.definitions).to.be.an('object');
        expect(cmd.definitions.command).to.be.an('object');
        expect(cmd.definitions.event).to.be.an('object');
        expect(cmd.defineCommand).to.be.a('function');
        expect(cmd.defineEvent).to.be.a('function');
        expect(cmd.defineOptions).to.be.a('function');

        expect(cmd.defineValidation).to.be.a('function');
        expect(cmd.validate).to.be.a('function');
        expect(cmd.handle).to.be.a('function');

      });

    });

    describe('calling defineValidation', function () {

      describe('without arguments', function () {
        
        it('it should throw an error', function () {

          var cmdFn = function () {};
          var cmd = api.defineCommand({ version: 3, payload: 'some.path' }, cmdFn);

          expect(function () {
            cmd.defineValidation();
          }).to.throwError('function');
          
        });

      });
      
      describe('with wrong argument', function () {

        it('it should throw an error', function () {

          var cmdFn = function () {};
          var cmd = api.defineCommand({ version: 3, payload: 'some.path' }, cmdFn);

          expect(function () {
            cmd.defineValidation(3);
          }).to.throwError('function');

        });
        
      });

      describe('with correct argument', function () {

        it('it should not throw an error', function () {

          var cmdFn = function () {};
          var cmd = api.defineCommand({ version: 3, payload: 'some.path' }, cmdFn);

          expect(function () {
            cmd.defineValidation(function () {});
          }).not.to.throwError();

        });

        it('it should work as expected', function () {

          var cmdFn = function () {};
          var cmd = api.defineCommand({ version: 3, payload: 'some.path' }, cmdFn);

          var valFn = function () {};
          cmd.defineValidation(valFn);
          expect(cmd.validator).to.eql(valFn);

        });

      });
      
    });
    
    describe('calling validate', function () {
      
      it('it should call the injected validator function', function (done) {

        var cmdFn = function () {};
        var cmd = api.defineCommand({ version: 3, payload: 'some.path' }, cmdFn);
        var cmdObj = { my: 'command' };
        
        var valFn = function (cmd) {
          expect(cmd).to.eql(cmdObj);
          done();
        };
        cmd.defineValidation(valFn);
        cmd.validate(cmdObj);
        
      });
      
    });

    describe('handling a command', function () {

      describe('with default payload', function () {

        it('it should work as expected', function (done) {
          var cmdObj = { my: 'command', with: { deep: 'value' } };
          var aggregateObj = { get: function () {}, has: function () {} };

          var cmdFn = function (cmd, aggregateModel) {
            expect(cmd).to.eql(cmdObj);
            expect(aggregateModel).to.eql(aggregateObj);
            done();
          };

          var cmd = api.defineCommand({}, cmdFn);

          cmd.handle(cmdObj, aggregateObj);
        });

      });

      describe('with custom payload', function () {

        it('it should work as expected', function (done) {
          var cmdObj = { my: 'command', with: { deep: 'value' } };
          var aggregateObj = { get: function () {}, has: function () {} };

          var cmdFn = function (cmd, aggregateModel) {
            expect(cmd).to.eql(cmdObj.with);
            expect(aggregateModel).to.eql(aggregateObj);
            done();
          };

          var cmd = api.defineCommand({ payload: 'with' }, cmdFn);

          cmd.handle(cmdObj, aggregateObj);
        });

      });

    });

  });

});
