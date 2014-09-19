var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../../../lib/definitionBase'),
  CommandHandler = require('../../../lib/definitions/commandHandler'),
  DefaultCommandHandler = require('../../../lib/defaultCommandHandler'),
  Aggregate = require('../../../lib/definitions/aggregate'),
  eventStore = require('eventstore')(),
  aggregateLock = require('../../../lib/lock').create(),
  api = require('../../../');

describe('commandHandler definition', function () {

  describe('creating a new commandHandler definition', function () {

    describe('without any arguments', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineCommandHandler();
        }).to.throwError(/function/);

      });

    });

    describe('without commandHandler function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineCommandHandler(null);
        }).to.throwError(/function/);

      });

    });

    describe('with a wrong commandHandler function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineCommandHandler(null, 'not a function');
        }).to.throwError(/function/);

      });

    });

    describe('with a correct commandHandler function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          api.defineCommandHandler(null, function () {});
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var cmdHndFn = function () {};
        var cmdHnd = api.defineCommandHandler(null, cmdHndFn);
        expect(cmdHnd).to.be.a(DefinitionBase);
        expect(cmdHnd).to.be.a(DefaultCommandHandler);
        expect(cmdHnd).to.be.a(CommandHandler);
        expect(cmdHnd.id).to.be.a('string');
        expect(cmdHnd.cmdHndlFn).to.eql(cmdHndFn);
        expect(cmdHnd.definitions).to.be.an('object');
        expect(cmdHnd.definitions.command).to.be.an('object');
        expect(cmdHnd.definitions.event).to.be.an('object');
        expect(cmdHnd.defineCommand).to.be.a('function');
        expect(cmdHnd.defineEvent).to.be.a('function');
        expect(cmdHnd.defineOptions).to.be.a('function');

        expect(cmdHnd.handle).to.be.a('function');

      });

    });

    describe('with some meta infos and a correct commandHandler function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          api.defineCommandHandler({ name: 'commandName', version: 3 }, function () {});
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var cmdHndFn = function () {};
        var cmdHnd = api.defineCommandHandler({ name: 'commandName', version: 3 }, cmdHndFn);
        expect(cmdHnd).to.be.a(DefinitionBase);
        expect(cmdHnd).to.be.a(DefaultCommandHandler);
        expect(cmdHnd).to.be.a(CommandHandler);
        expect(cmdHnd.id).to.be.a('string');
        expect(cmdHnd.cmdHndlFn).to.eql(cmdHndFn);
        expect(cmdHnd.definitions).to.be.an('object');
        expect(cmdHnd.definitions.command).to.be.an('object');
        expect(cmdHnd.definitions.event).to.be.an('object');
        expect(cmdHnd.defineCommand).to.be.a('function');
        expect(cmdHnd.defineEvent).to.be.a('function');
        expect(cmdHnd.defineOptions).to.be.a('function');

        expect(cmdHnd.handle).to.be.a('function');

      });

    });

    describe('handling a command', function () {

      it('it should work as expected', function (done) {
        var cmdObj = { my: 'command', with: { deep: 'value' }, aggregate: { id: '1234' } };
        var clb = function () {};

        var cmdHndFn = function (aggId, cmd, commandHandler, callback) {
          expect(aggId).to.eql('1234');
          expect(cmd).to.eql(cmdObj);
          expect(commandHandler).to.eql(cmdHnd);
          expect(clb).to.be.a('function');
          done();
        };

        var cmdHnd = api.defineCommandHandler({ name: 'commandName', version: 3 }, cmdHndFn);
        
        // dummy / mock stuff...
        var agg = new Aggregate();
        agg.validateCommand = function (cmd) {
          return null;
        };
        cmdHnd.useAggregate(agg);
        cmdHnd.useEventStore(eventStore);
        cmdHnd.useAggregateLock(aggregateLock);
        
        cmdHnd.handle(cmdObj, clb);
      });

    });

  });

});
