var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../../../lib/definitionBase'),
  Command = require('../../../lib/definitions/command'),
  BusinessRuleError = require('../../../lib/errors/businessRuleError'),
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
        expect(cmd.payload).to.eql(null);
        expect(cmd.definitions).to.be.an('object');
        expect(cmd.definitions.command).to.be.an('object');
        expect(cmd.definitions.event).to.be.an('object');
        expect(cmd.defineCommand).to.be.a('function');
        expect(cmd.defineEvent).to.be.a('function');
        expect(cmd.defineOptions).to.be.a('function');

        expect(cmd.defineAggregate).to.be.a('function');
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

        expect(cmd.defineAggregate).to.be.a('function');
        expect(cmd.defineValidation).to.be.a('function');
        expect(cmd.validate).to.be.a('function');
        expect(cmd.handle).to.be.a('function');

      });

    });

    describe('calling defineAggregate', function () {

      describe('with a wrong object', function () {

        it('it should throw an error', function () {

          var cmd = api.defineCommand(null, function () {});

          expect(function () {
            cmd.defineAggregate();
          }).to.throwError(/aggregate/);

        });

      });

      describe('with a correct object', function () {

        it('it should work as expected', function () {

          var cmd = api.defineCommand(null, function () {});

          cmd.defineAggregate({ name: 'aggrName' });

          expect(cmd.aggregate.name).to.eql('aggrName');

        });

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

        // it('it should work as expected', function () {
        //
        //   var cmdFn = function () {};
        //   var cmd = api.defineCommand({ version: 3, payload: 'some.path' }, cmdFn);
        //
        //   var valFn = function () {};
        //   cmd.defineValidation(valFn);
        //   expect(cmd.validator).to.eql(valFn);
        //
        // });

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

    describe('working with priority', function () {

      it('it should order it correctly', function () {

        var cmdFn = function () {};
        var cmd = api.defineCommand({ version: 3, payload: 'some.path' }, cmdFn);
        var aggr = { name: 'myAggr', defaultPreConditionPayload: 'fromAggr' };
        cmd.defineAggregate(aggr);

        cmd.addPreCondition({ name: 'myRule2', priority: 3, defineAggregate: function (a) { expect(a).to.eql(aggr); } });
        cmd.addPreCondition({ name: 'myRule4', priority: Infinity, defineAggregate: function (a) { expect(a).to.eql(aggr); } });
        cmd.addPreCondition({ name: 'myRule1', priority: 1, payload: 'mySpec', defineAggregate: function (a) { expect(a).to.eql(aggr); } });
        cmd.addPreCondition({ name: 'myRule3', priority: 5, defineAggregate: function (a) { expect(a).to.eql(aggr); } });

        expect(cmd.preConditions.length).to.eql(4);
        expect(cmd.preConditions[0].name).to.eql('myRule1');
        expect(cmd.preConditions[0].payload).to.eql('mySpec');
        expect(cmd.preConditions[1].name).to.eql('myRule2');
        expect(cmd.preConditions[1].payload).to.eql('fromAggr');
        expect(cmd.preConditions[2].name).to.eql('myRule3');
        expect(cmd.preConditions[2].payload).to.eql('fromAggr');
        expect(cmd.preConditions[3].name).to.eql('myRule4');
        expect(cmd.preConditions[3].payload).to.eql('fromAggr');

      });

    });

    describe('checking pre-condition', function () {

      it('it should work as expected', function (done) {
        var cmdObj = { my: 'command', with: { deep: 'value' } };
        var aggregateObj = { get: function () {}, has: function () {} };

        var calledPc1 = false;
        var calledPc2 = false;
        var calledPc3 = false;

        var pc = api.definePreCondition({}, function (cmd, aggregateModel, callback) {
          expect(cmd).to.eql(cmdObj);
          expect(aggregateModel).to.eql(aggregateObj);
          calledPc1 = true;
          callback();
        });

        var pc2 = api.definePreCondition({}, function (cmd, aggregateModel, callback) {
          expect(cmd).to.eql(cmdObj);
          expect(aggregateModel).to.eql(aggregateObj);
          calledPc2 = true;
          callback();
        });

        var pc3 = api.definePreCondition({ version: 1 }, function (cmd, aggregateModel, callback) {
          calledPc3 = true;
          callback();
        });

        var cmd = api.defineCommand({}, function () {});

        cmd.defineAggregate({ name: 'myAggr' });

        cmd.addPreCondition(pc);

        cmd.addPreCondition(pc2);

        cmd.addPreCondition(pc3);

        cmd.checkPreConditions(cmdObj, aggregateObj, function (err) {
          expect(err).not.to.be.ok();
          expect(calledPc1).to.eql(true);
          expect(calledPc2).to.eql(true);
          expect(calledPc3).to.eql(false);
          done();
        });
      });

    });

    describe('checking existing flag [true]', function () {

      it('it should work as expected', function (done) {
        var cmdObj = { my: 'command', with: { deep: 'value' } };
        var aggregateObj = { id: 'myId', get: function () { return 0; }, has: function () {} };


        var cmd = api.defineCommand({ existing: true }, function () {});

        cmd.defineAggregate({ name: 'myAggr' });

        cmd.checkPreConditions(cmdObj, aggregateObj, function (err) {
          expect(err).to.be.ok();
          expect(err).to.be.a(BusinessRuleError);
          expect(err.message).to.match(/already existing/);
          expect(err.more.aggregateId).to.eql('myId');
          expect(err.more.aggregateRevision).to.eql(0);
          expect(err.more.type).to.eql('AggregateNotExisting');
          done();
        });
      });

    });

    describe('checking existing flag [false]', function () {

      it('it should work as expected', function (done) {
        var cmdObj = { my: 'command', with: { deep: 'value' } };
        var aggregateObj = { id: 'myId', get: function () { return 1; }, has: function () {} };


        var cmd = api.defineCommand({ existing: false }, function () {});

        cmd.defineAggregate({ name: 'myAggr' });

        cmd.checkPreConditions(cmdObj, aggregateObj, function (err) {
          expect(err).to.be.ok();
          expect(err).to.be.a(BusinessRuleError);
          expect(err.message).to.match(/not existing/);
          expect(err.more.aggregateId).to.eql('myId');
          expect(err.more.aggregateRevision).to.eql(1);
          expect(err.more.type).to.eql('AggregateAlreadyExisting');
          done();
        });
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
            cmd.deep = 'duup';
            done();
          };

          var cmd = api.defineCommand({ payload: 'with' }, cmdFn);

          cmd.handle(cmdObj, aggregateObj);

          expect(cmdObj.with.deep).to.eql('value');
        });

      });

    });

  });

});
