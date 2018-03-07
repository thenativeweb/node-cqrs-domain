var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../../../lib/definitionBase'),
  Aggregate = require('../../../lib/definitions/aggregate'),
  DefaultCommandHandler = require('../../../lib/defaultCommandHandler'),
  AggregateModel = require('../../../lib/aggregateModel'),
  api = require('../../../');

describe('aggregate definition', function () {

  describe('creating a new aggregate definition', function () {

    it('it should not throw an error', function () {

      expect(function () {
        api.defineAggregate();
      }).not.to.throwError();

    });

    it('it should return a correct object', function () {

      var aggr = api.defineAggregate();
      expect(aggr).to.be.a(DefinitionBase);
      expect(aggr).to.be.an(Aggregate);
      expect(aggr.definitions).to.be.an('object');
      expect(aggr.definitions.command).to.be.an('object');
      expect(aggr.definitions.event).to.be.an('object');
      expect(aggr.defineCommand).to.be.a('function');
      expect(aggr.defineEvent).to.be.a('function');
      expect(aggr.defineOptions).to.be.a('function');

      expect(aggr.defineSnapshotConversion).to.be.a('function');
      expect(aggr.defineSnapshotNeed).to.be.a('function');

      expect(aggr.idGenerator).to.be.a('function');
      expect(aggr.defineAggregateIdGenerator).to.be.a('function');
      expect(aggr.defineCommandAwareAggregateIdGenerator).to.be.a('function');
      expect(aggr.defineContext).to.be.a('function');
      expect(aggr.addCommand).to.be.a('function');
      expect(aggr.addEvent).to.be.a('function');
      expect(aggr.addBusinessRule).to.be.a('function');
      expect(aggr.addCommandHandler).to.be.a('function');
      expect(aggr.getCommandsByName).to.be.a('function');
      expect(aggr.getCommand).to.be.a('function');
      expect(aggr.getCommands).to.be.a('function');
      expect(aggr.getEvent).to.be.a('function');
      expect(aggr.getEvents).to.be.a('function');
      expect(aggr.getBusinessRules).to.be.a('function');
      expect(aggr.getCommandHandlers).to.be.a('function');
      expect(aggr.getCommandHandler).to.be.a('function');
      expect(aggr.create).to.be.a('function');
      expect(aggr.validateCommand).to.be.a('function');
      expect(aggr.checkBusinessRules).to.be.a('function');
      expect(aggr.handle).to.be.a('function');
      expect(aggr.apply).to.be.a('function');
      expect(aggr.loadFromHistory).to.be.a('function');
      expect(aggr.isSnapshotNeeded).to.be.a('function');

    });

    describe('defining snapshot conversions', function () {

      describe('by passing no version', function () {

        it('it should throw an error', function () {

          var aggr = api.defineAggregate();

          expect(function () {
            aggr.defineSnapshotConversion();
          }).to.throwError(/version/);

        });

      });

      describe('by passing no function', function () {

        it('it should throw an error', function () {

          var aggr = api.defineAggregate();

          expect(function () {
            aggr.defineSnapshotConversion({ version: 3 });
          }).to.throwError(/function/);

        });

      });

      describe('by passing all valid arguments', function () {

        it('it should save them as expected', function () {

          var aggr = api.defineAggregate({ name: 'a' });
          var fn1 = function () {};
          var fn2 = function () {};
          aggr.defineSnapshotConversion({ version: 2 }, fn1);
          aggr.defineSnapshotConversion({ version: 3 }, fn2);
          aggr.defineContext({ name: 'c' });
          expect(aggr.snapshotConversions['c.a.2']).to.eql(fn1);
          expect(aggr.snapshotConversions['c.a.3']).to.eql(fn2);

        });

      });

    });

    describe('defining snapshot need', function () {

      describe('by passing no function', function () {

        it('it should throw an error', function () {

          var aggr = api.defineAggregate();

          expect(function () {
            aggr.defineSnapshotNeed();
          }).to.throwError(/function/);

        });

      });

      describe('by passing all valid arguments', function () {

        it('it should save them as expected', function () {

          var aggr = api.defineAggregate();
          var fn = function () {};
          aggr.defineSnapshotNeed(fn);
          expect(aggr.isSnapshotNeeded).to.eql(fn);

        });

      });

    });

    describe('defining an id generator function', function() {

      var aggr;

      beforeEach(function () {
        aggr = api.defineAggregate();
        aggr.getNewId = null;
      });

      describe('in a synchronous way', function() {

        it('it should be transformed internally to an asynchronous way', function(done) {

          aggr.idGenerator(function () {
            var id = require('uuid').v4().toString();
            return id;
          });

          aggr.getNewId(function (err, id) {
            expect(id).to.be.a('string');
            done();
          });

        });

      });

      describe('in an synchronous way', function() {

        it('it should be taken as it is', function(done) {

          aggr.idGenerator(function (callback) {
            setTimeout(function () {
              var id = require('uuid').v4().toString();
              callback(null, id);
            }, 10);
          });

          aggr.getNewId(function (err, id) {
            expect(id).to.be.a('string');
            done();
          });

        });

      });

    });

    describe('defining an id generator function for aggregate id', function() {

      var aggr;

      beforeEach(function () {
        aggr = api.defineAggregate();
        aggr.getNewAggregateId = null;
      });

      describe('in a synchronous way', function() {

        it('it should be transformed internally to an asynchronous way', function(done) {

          aggr.defineAggregateIdGenerator(function () {
            var id = require('uuid').v4().toString();
            return id;
          });

          aggr.getNewAggregateId(function (err, id) {
            expect(id).to.be.a('string');
            done();
          });

        });

      });

      describe('in a synchronous way command aware', function() {

        it('it should be transformed internally to an asynchronous way', function(done) {

          aggr.defineCommandAwareAggregateIdGenerator(function (cmd) {
            var id = cmd.id + require('uuid').v4().toString();
            return id;
          });

          aggr.getNewAggregateId({ id: 'cmdId' }, function (err, id) {
            expect(id).to.be.a('string');
            expect(id.indexOf('cmdId')).to.eql(0);
            done();
          });

        });

      });

      describe('in an asynchronous way', function() {

        it('it should be taken as it is', function(done) {

          aggr.defineAggregateIdGenerator(function (callback) {
            setTimeout(function () {
              var id = require('uuid').v4().toString();
              callback(null, id);
            }, 10);
          });

          aggr.getNewAggregateId(function (err, id) {
            expect(id).to.be.a('string');
            done();
          });

        });

      });

      describe('in an asynchronous way command aware', function() {

        it('it should be taken as it is', function(done) {

          aggr.defineCommandAwareAggregateIdGenerator(function (cmd, callback) {
            setTimeout(function () {
              var id = cmd.id + require('uuid').v4().toString();
              callback(null, id);
            }, 10);
          });

          aggr.getNewAggregateId({ id: 'cmdId' }, function (err, id) {
            expect(id).to.be.a('string');
            expect(id.indexOf('cmdId')).to.eql(0);
            done();
          });

        });

      });

    });

    describe('calling defineContext', function () {

      describe('with a wrong object', function () {

        it('it should throw an error', function () {

          var aggr = api.defineAggregate();

          expect(function () {
            aggr.defineContext();
          }).to.throwError(/context/);

        });

      });

      describe('with a correct object', function () {

        it('it should work as expected', function () {

          var aggr = api.defineAggregate();

          aggr.defineContext({ name: 'contextName' });

          expect(aggr.context.name).to.eql('contextName');

        });

      });

    });

    describe('calling addCommand', function () {

      describe('with a wrong object', function () {

        it('it should throw an error', function () {

          var aggr = api.defineAggregate();

          expect(function () {
            aggr.addCommand();
          }).to.throwError(/command/);

        });

      });

      describe('with a correct object', function () {

        it('it should work as expected', function () {

          var aggr = api.defineAggregate();

          var defineAggregateCalled = false;
          aggr.addCommand({ name: 'myCommand', defineAggregate: function (a) {
            expect(a).to.eql(aggr);
            defineAggregateCalled = true;
          }});

          expect(aggr.commands.length).to.eql(1);
          expect(aggr.commands[0].name).to.eql('myCommand');
          expect(defineAggregateCalled).to.eql(true);

        });

      });

      describe('having not defined a default payload for commands', function () {

        describe('having not defined a payload in the command', function () {

          it('it should work as expected', function () {

            var aggr = api.defineAggregate();

            var defineAggregateCalled = false;
            aggr.addCommand({ name: 'myCommand', payload: null, defineAggregate: function (a) {
              expect(a).to.eql(aggr);
              defineAggregateCalled = true;
            }});

            expect(aggr.commands.length).to.eql(1);
            expect(aggr.commands[0].payload).to.eql('');
            expect(defineAggregateCalled).to.eql(true);

          });

        });

        describe('having defined a payload in the command', function () {

          it('it should work as expected', function () {

            var aggr = api.defineAggregate();

            var defineAggregateCalled = false;
            aggr.addCommand({ name: 'myCommand', payload: 'maPay', defineAggregate: function (a) {
              expect(a).to.eql(aggr);
              defineAggregateCalled = true;
            }});

            expect(aggr.commands.length).to.eql(1);
            expect(aggr.commands[0].payload).to.eql('maPay');
            expect(defineAggregateCalled).to.eql(true);

          });

        });

      });

      describe('having defined a default payload for commands', function () {

        describe('having not defined a payload in the command', function () {

          it('it should work as expected', function () {

            var aggr = api.defineAggregate({ defaultCommandPayload: 'def'});

            var defineAggregateCalled = false;
            aggr.addCommand({ name: 'myCommand', payload: null, defineAggregate: function (a) {
              expect(a).to.eql(aggr);
              defineAggregateCalled = true;
            } });

            expect(aggr.commands.length).to.eql(1);
            expect(aggr.commands[0].payload).to.eql('def');
            expect(defineAggregateCalled).to.eql(true);

          });

        });

        describe('having defined a payload in the command', function () {

          it('it should work as expected', function () {

            var aggr = api.defineAggregate({ defaultCommandPayload: 'def'});

            var defineAggregateCalled = false;
            aggr.addCommand({ name: 'myCommand', payload: 'maPay', defineAggregate: function (a) {
              expect(a).to.eql(aggr);
              defineAggregateCalled = true;
            }});

            expect(aggr.commands.length).to.eql(1);
            expect(aggr.commands[0].payload).to.eql('maPay');
            expect(defineAggregateCalled).to.eql(true);

          });

        });

      });

    });

    describe('calling addEvent', function () {

      describe('with a wrong object', function () {

        it('it should throw an error', function () {

          var aggr = api.defineAggregate();

          expect(function () {
            aggr.addEvent();
          }).to.throwError(/event/);

        });

      });

      describe('with a correct object', function () {

        it('it should work as expected', function () {

          var aggr = api.defineAggregate();

          aggr.addEvent({ name: 'myEvent' });

          expect(aggr.events.length).to.eql(1);
          expect(aggr.events[0].name).to.eql('myEvent');

        });

      });

      describe('having not defined a default payload for events', function () {

        describe('having not defined a payload in the event', function () {

          it('it should work as expected', function () {

            var aggr = api.defineAggregate();

            aggr.addEvent({ name: 'myEvent', payload: null });

            expect(aggr.events.length).to.eql(1);
            expect(aggr.events[0].payload).to.eql('');

          });

        });

        describe('having defined a payload in the event', function () {

          it('it should work as expected', function () {

            var aggr = api.defineAggregate();

            aggr.addEvent({ name: 'myEvent', payload: 'maPay' });

            expect(aggr.events.length).to.eql(1);
            expect(aggr.events[0].payload).to.eql('maPay');

          });

        });

      });

      describe('having defined a default payload for events', function () {

        describe('having not defined a payload in the event', function () {

          it('it should work as expected', function () {

            var aggr = api.defineAggregate({ defaultEventPayload: 'def' });

            aggr.addEvent({ name: 'myEvent', payload: null });

            expect(aggr.events.length).to.eql(1);
            expect(aggr.events[0].payload).to.eql('def');

          });

        });

        describe('having defined a payload in the command', function () {

          it('it should work as expected', function () {

            var aggr = api.defineAggregate({ defaultEventPayload: 'def' });

            aggr.addEvent({ name: 'myEvent', payload: 'maPay' });

            expect(aggr.events.length).to.eql(1);
            expect(aggr.events[0].payload).to.eql('maPay');

          });

        });

      });

    });

    describe('calling addBusinessRule', function () {

      describe('with a wrong object', function () {

        it('it should throw an error', function () {

          var aggr = api.defineAggregate();

          expect(function () {
            aggr.addBusinessRule();
          }).to.throwError(/businessRule/);

        });

      });

      describe('with a correct object', function () {

        it('it should work as expected', function () {

          var aggr = api.defineAggregate();

          aggr.addBusinessRule({ name: 'myRule', defineAggregate: function (a) { expect(a).to.eql(aggr); } });

          expect(aggr.businessRules.length).to.eql(1);
          expect(aggr.businessRules[0].name).to.eql('myRule');

        });

      });

      describe('working with priority', function () {

        it('it should order it correctly', function () {

          var aggr = api.defineAggregate();

          aggr.addBusinessRule({ name: 'myRule2', priority: 3, defineAggregate: function (a) { expect(a).to.eql(aggr); } });
          aggr.addBusinessRule({ name: 'myRule4', priority: Infinity, defineAggregate: function (a) { expect(a).to.eql(aggr); } });
          aggr.addBusinessRule({ name: 'myRule1', priority: 1, defineAggregate: function (a) { expect(a).to.eql(aggr); } });
          aggr.addBusinessRule({ name: 'myRule3', priority: 5, defineAggregate: function (a) { expect(a).to.eql(aggr); } });

          expect(aggr.businessRules.length).to.eql(4);
          expect(aggr.businessRules[0].name).to.eql('myRule1');
          expect(aggr.businessRules[1].name).to.eql('myRule2');
          expect(aggr.businessRules[2].name).to.eql('myRule3');
          expect(aggr.businessRules[3].name).to.eql('myRule4');

        });

      });

    });

    describe('calling addCommandHandler', function () {

      describe('with a wrong object', function () {

        it('it should throw an error', function () {

          var aggr = api.defineAggregate();

          expect(function () {
            aggr.addCommandHandler();
          }).to.throwError(/commandHandler/);

          expect(function () {
            aggr.addCommandHandler({ name: 'myCmdHndlName' });
          }).to.throwError(/commandHandler/);

        });

      });

      describe('with a correct object', function () {

        it('it should work as expected', function () {

          var aggr = api.defineAggregate();

          var cmdHndl = {
            name: 'myCommandHandler',
            useAggregate: function(agg) {
              expect(agg).to.eql(aggr);
            }
          };

          aggr.addCommandHandler(cmdHndl);

          expect(aggr.commandHandlers.length).to.eql(1);
          expect(aggr.commandHandlers[0]).to.eql(cmdHndl);

        });

      });

    });

    describe('having added some commands', function () {

      var aggr;

      beforeEach(function () {
        aggr = api.defineAggregate();
        aggr.addCommand({ name: 'cmd1', version: 0, defineAggregate: function () {} });
        aggr.addCommand({ name: 'cmd2', version: 0, defineAggregate: function () {} });
        aggr.addCommand({ name: 'cmd2', version: 1, defineAggregate: function () {} });
        aggr.addCommand({ name: 'cmd2', version: 2, defineAggregate: function () {} });
        aggr.addCommand({ name: 'cmd3', version: 0, defineAggregate: function () {} });
      });

      describe('calling getCommands', function () {

        it('it should return all commands', function () {

          var cmds = aggr.getCommands();
          expect(cmds.length).to.eql(5);
          expect(cmds[0].name).to.eql('cmd1');
          expect(cmds[0].version).to.eql(0);
          expect(cmds[1].name).to.eql('cmd2');
          expect(cmds[1].version).to.eql(0);
          expect(cmds[2].name).to.eql('cmd2');
          expect(cmds[2].version).to.eql(1);
          expect(cmds[3].name).to.eql('cmd2');
          expect(cmds[3].version).to.eql(2);
          expect(cmds[4].name).to.eql('cmd3');
          expect(cmds[4].version).to.eql(0);

        });

      });

      describe('calling getCommandsByName', function () {

        it('it should work as expected', function () {

          var ex0 = aggr.getCommandsByName('someCmdName');
          expect(ex0.length).to.eql(0);

          var ex1 = aggr.getCommandsByName('cmd1');
          expect(ex1.length).to.eql(1);
          expect(ex1[0].name).to.eql('cmd1');
          expect(ex1[0].version).to.eql(0);

          var ex2 = aggr.getCommandsByName('cmd2');
          expect(ex2.length).to.eql(3);
          expect(ex2[0].name).to.eql('cmd2');
          expect(ex2[0].version).to.eql(0);
          expect(ex2[1].name).to.eql('cmd2');
          expect(ex2[1].version).to.eql(1);
          expect(ex2[2].name).to.eql('cmd2');
          expect(ex2[2].version).to.eql(2);

          var ex3 = aggr.getCommandsByName('cmd3');
          expect(ex3.length).to.eql(1);
          expect(ex3[0].name).to.eql('cmd3');
          expect(ex3[0].version).to.eql(0);

        });

      });

      describe('calling getCommand', function () {

        it('it should work as expected', function () {

          var ex0 = aggr.getCommand('someCmd', 0);
          expect(ex0).not.to.be.ok();

          var ex1 = aggr.getCommand('cmd1', 3);
          expect(ex1).not.to.be.ok();

          var ex2 = aggr.getCommand('cmd1', 0);
          expect(ex2.name).to.eql('cmd1');
          expect(ex2.version).to.eql(0);

          var ex3 = aggr.getCommand('cmd2', 0);
          expect(ex3.name).to.eql('cmd2');
          expect(ex3.version).to.eql(0);

          var ex4 = aggr.getCommand('cmd2', 1);
          expect(ex4.name).to.eql('cmd2');
          expect(ex4.version).to.eql(1);

          var ex5 = aggr.getCommand('cmd2', 2);
          expect(ex5.name).to.eql('cmd2');
          expect(ex5.version).to.eql(2);

          var ex6 = aggr.getCommand('cmd3', 0);
          expect(ex6.name).to.eql('cmd3');
          expect(ex6.version).to.eql(0);

          var ex7 = aggr.getCommand('cmd3');
          expect(ex7.name).to.eql('cmd3');
          expect(ex7.version).to.eql(0);

          var ex8 = aggr.getCommand('cmd2');
          expect(ex8.name).to.eql('cmd2');
          expect(ex8.version).to.eql(0);

        });

      });

    });

    describe('having added some events', function () {

      var aggr;

      beforeEach(function () {
        aggr = api.defineAggregate();
        aggr.addEvent({ name: 'evt1', version: 0 });
        aggr.addEvent({ name: 'evt2', version: 0 });
        aggr.addEvent({ name: 'evt2', version: 1 });
        aggr.addEvent({ name: 'evt2', version: 2 });
        aggr.addEvent({ name: 'evt3', version: 0 });
      });

      describe('calling getEvents', function () {

        it('it should return all events', function () {

          var evts = aggr.getEvents();
          expect(evts.length).to.eql(5);
          expect(evts[0].name).to.eql('evt1');
          expect(evts[0].version).to.eql(0);
          expect(evts[1].name).to.eql('evt2');
          expect(evts[1].version).to.eql(0);
          expect(evts[2].name).to.eql('evt2');
          expect(evts[2].version).to.eql(1);
          expect(evts[3].name).to.eql('evt2');
          expect(evts[3].version).to.eql(2);
          expect(evts[4].name).to.eql('evt3');
          expect(evts[4].version).to.eql(0);

        });

      });

      describe('calling getEvent', function () {

        it('it should work as expected', function () {

          var ex0 = aggr.getEvent('someEvt', 0);
          expect(ex0).not.to.be.ok();

          var ex1 = aggr.getEvent('evt1', 3);
          expect(ex1).not.to.be.ok();

          var ex2 = aggr.getEvent('evt1', 0);
          expect(ex2.name).to.eql('evt1');
          expect(ex2.version).to.eql(0);

          var ex3 = aggr.getEvent('evt2', 0);
          expect(ex3.name).to.eql('evt2');
          expect(ex3.version).to.eql(0);

          var ex4 = aggr.getEvent('evt2', 1);
          expect(ex4.name).to.eql('evt2');
          expect(ex4.version).to.eql(1);

          var ex5 = aggr.getEvent('evt2', 2);
          expect(ex5.name).to.eql('evt2');
          expect(ex5.version).to.eql(2);

          var ex6 = aggr.getEvent('evt3', 0);
          expect(ex6.name).to.eql('evt3');
          expect(ex6.version).to.eql(0);

          var ex7 = aggr.getEvent('evt3');
          expect(ex7.name).to.eql('evt3');
          expect(ex7.version).to.eql(0);

          var ex8 = aggr.getEvent('evt2');
          expect(ex8.name).to.eql('evt2');
          expect(ex8.version).to.eql(0);

        });

      });

    });

    describe('having added some command handlers', function () {

      var aggr;

      beforeEach(function () {
        aggr = api.defineAggregate();
        aggr.addCommand({ name: 'someCmdHndl', version: 0, defineAggregate: function () {} });
        aggr.addCommand({ name: 'cmdHndl1', version: 0, defineAggregate: function () {} });
        aggr.addCommand({ name: 'cmdHndl2', version: 0, defineAggregate: function () {} });
        aggr.addCommand({ name: 'cmdHndl2', version: 1, defineAggregate: function () {} });
        aggr.addCommand({ name: 'cmdHndl2', version: 2, defineAggregate: function () {} });
        aggr.addCommand({ name: 'cmdHndl3', version: 0, defineAggregate: function () {} });
        aggr.addCommandHandler({ name: 'cmdHndl1', version: 0, useAggregate: function () {} });
        aggr.addCommandHandler({ name: 'cmdHndl2', version: 0, useAggregate: function () {} });
        aggr.addCommandHandler({ name: 'cmdHndl2', version: 1, useAggregate: function () {} });
        aggr.addCommandHandler({ name: 'cmdHndl2', version: 2, useAggregate: function () {} });
        aggr.addCommandHandler({ name: 'cmdHndl3', version: 0, useAggregate: function () {} });
      });

      describe('calling getCommandHandlers', function () {

        it('it should return all commandHandlers', function () {

          var cmdHndls = aggr.getCommandHandlers();
          expect(cmdHndls.length).to.eql(5);
          expect(cmdHndls[0].name).to.eql('cmdHndl1');
          expect(cmdHndls[0].version).to.eql(0);
          expect(cmdHndls[1].name).to.eql('cmdHndl2');
          expect(cmdHndls[1].version).to.eql(0);
          expect(cmdHndls[2].name).to.eql('cmdHndl2');
          expect(cmdHndls[2].version).to.eql(1);
          expect(cmdHndls[3].name).to.eql('cmdHndl2');
          expect(cmdHndls[3].version).to.eql(2);
          expect(cmdHndls[4].name).to.eql('cmdHndl3');
          expect(cmdHndls[4].version).to.eql(0);

        });

      });

      describe('calling getCommandHandler', function () {

        it('it should work as expected', function () {

          var ex0 = aggr.getCommandHandler('someCmdHndl', 0);
          expect(ex0).to.be.a(DefaultCommandHandler);
          expect(ex0).to.eql(aggr.defaultCommandHandler);

          var ex1 = aggr.getCommandHandler('cmdHndl1', 3);
          expect(ex0).to.be.a(DefaultCommandHandler);
          expect(ex0).to.eql(aggr.defaultCommandHandler);

          var ex2 = aggr.getCommandHandler('cmdHndl1', 0);
          expect(ex2.name).to.eql('cmdHndl1');
          expect(ex2.version).to.eql(0);

          var ex3 = aggr.getCommandHandler('cmdHndl2', 0);
          expect(ex3.name).to.eql('cmdHndl2');
          expect(ex3.version).to.eql(0);

          var ex4 = aggr.getCommandHandler('cmdHndl2', 1);
          expect(ex4.name).to.eql('cmdHndl2');
          expect(ex4.version).to.eql(1);

          var ex5 = aggr.getCommandHandler('cmdHndl2', 2);
          expect(ex5.name).to.eql('cmdHndl2');
          expect(ex5.version).to.eql(2);

          var ex6 = aggr.getCommandHandler('cmdHndl3', 0);
          expect(ex6.name).to.eql('cmdHndl3');
          expect(ex6.version).to.eql(0);

          var ex7 = aggr.getCommandHandler('cmdHndl3');
          expect(ex7.name).to.eql('cmdHndl3');
          expect(ex7.version).to.eql(0);

          var ex8 = aggr.getCommandHandler('cmdHndl2');
          expect(ex8.name).to.eql('cmdHndl2');
          expect(ex8.version).to.eql(0);

        });

      });

    });

    describe('calling create', function () {

      describe('with a wrong id', function () {

        it('it should throw an error', function () {

          var aggr = api.defineAggregate();

          expect(function () {
            aggr.create(123);
          }).to.throwError(/id/);

        });

      });

      describe('with a correct id', function () {

        it('it should not throw an error', function () {

          var aggr = api.defineAggregate();

          expect(function () {
            aggr.create('123');
          }).not.to.throwError();

        });

        it('it should return a correct object', function () {

          var aggr = api.defineAggregate();
          var agg = aggr.create('123');
          expect(agg).to.be.a(AggregateModel);
          expect(agg.set).to.be.a('function');
          expect(agg.get).to.be.a('function');
          expect(agg.has).to.be.a('function');
          expect(agg.setRevision).to.be.a('function');
          expect(agg.getRevision).to.be.a('function');
          expect(agg.destroy).to.be.a('function');
          expect(agg.isDestroyed).to.be.a('function');
          expect(agg.getUncommittedEvents).to.be.a('function');
          expect(agg.addUncommittedEvent).to.be.a('function');
          expect(agg.clearUncommittedEvents).to.be.a('function');
          expect(agg.toJSON).to.be.a('function');

        });

      });

      describe('having defined initialization values', function () {

        it('it should work as expected', function () {

          var aggr = api.defineAggregate(null, { stuff: [] });
          var agg = aggr.create('123');
          expect(agg).to.be.a(AggregateModel);
          expect(agg.set).to.be.a('function');
          expect(agg.get).to.be.a('function');
          expect(agg.has).to.be.a('function');
          expect(agg.setRevision).to.be.a('function');
          expect(agg.getRevision).to.be.a('function');
          expect(agg.destroy).to.be.a('function');
          expect(agg.isDestroyed).to.be.a('function');
          expect(agg.getUncommittedEvents).to.be.a('function');
          expect(agg.addUncommittedEvent).to.be.a('function');
          expect(agg.clearUncommittedEvents).to.be.a('function');
          expect(agg.toJSON).to.be.a('function');

          expect(agg.get('stuff')).to.be.an('array');
          expect(agg.get('stuff').length).to.eql(0);

        });

      });

    });

    describe('calling validateCommand', function () {

      describe('passing a command object that not have a name', function () {

        it('it should throw an Error', function (done) {

          var aggr = api.defineAggregate();

          aggr.defineCommand({
            name: 'cmdName'
          });

          aggr.validateCommand({ my: 'cmd', with: 'payload' }, function(err){
            expect(err).to.be.an(Error);
            done();
          });

        });

      });

      describe('passing a command object that not matches an existing command', function () {

        it('it should throw an Error', function (done) {

          var aggr = api.defineAggregate();

          aggr.defineCommand({
            name: 'cmdName'
          });

          aggr.validateCommand({cmdName: 'cmd', with: 'payload'}, function (err) {
            expect(err).to.be.an(Error);
            done();
          });
        });


      });

      describe('passing a command object that matches an existing command', function () {

        it('it should not throw an Error', function (done) {

          var aggr = api.defineAggregate();

          aggr.defineCommand({
            name: 'cmdName',
            version: 'v'
          });

          aggr.addCommand({ name: 'cmd', version: 2, validate: function () { return null; }, defineAggregate: function () {} });

          aggr.validateCommand({ cmdName: 'cmd', v: 2, with: 'payload' }, function(error){
            expect(error).to.be.null;
            done();
          });

        });

        it('it should return what the command validation function returns', function (done) {

          var aggr = api.defineAggregate();

          aggr.defineCommand({
            name: 'cmdName',
            version: 'v'
          });

          aggr.addCommand({ name: 'cmd', version: 2, validate: function () { return 'myValidationRes'; }, defineAggregate: function () {} });

          aggr.validateCommand({ cmdName: 'cmd', v: 2, with: 'payload' }, function(err) {
            expect(err).to.eql('myValidationRes');
            done();
          });
        });

      });

    });

    describe('calling checkBusinessRules', function () {

      it('it should call the check function on the business rule objects', function (done) {

        var aggr = api.defineAggregate();

        var ch = 'changed';
        var pr = 'previous';
        var evt = 'events';
        var cmd = 'command';

        var called = 0;

        var br1 = {
          check: function (changed, previous, events, command, callback) {
            expect(changed).to.eql(ch);
            expect(previous).to.eql(pr);
            expect(events).to.eql(evt);
            expect(command).to.eql(cmd);
            called++;
            callback(null);
          }, defineAggregate: function (a) { expect(a).to.eql(aggr); }
        };

        var br2 = {
          check: function (changed, previous, events, command, callback) {
            expect(changed).to.eql(ch);
            expect(previous).to.eql(pr);
            expect(events).to.eql(evt);
            expect(command).to.eql(cmd);
            called++;
            callback(null);
          }, defineAggregate: function (a) { expect(a).to.eql(aggr); }
        };

        aggr.addBusinessRule(br1);
        aggr.addBusinessRule(br2);

        aggr.checkBusinessRules(ch, pr, evt, cmd, done);

      });

    });

    describe('calling isSnapshotNeeded', function () {

      describe('passing more events than threshold', function () {

        it('it should work as expected', function () {

          var aggr = api.defineAggregate();
          aggr.defineSnapshotNeed(function (time, evts, model) {
            return evts.length >= 2;
          });

          var res = aggr.isSnapshotNeeded(null, [1, 2, 3, 4]);

          expect(res).to.eql(true);

        });

      });

      describe('passing less events than threshold', function () {

        it('it should work as expected', function () {

          var aggr = api.defineAggregate();

          var res = aggr.isSnapshotNeeded(null, [1, 2, 3, 4]);

          expect(res).to.eql(false);

        });

      });

    });

    describe('calling apply', function () {

      describe('with no matching event name', function () {

        it('it should throw an error', function () {

          var aggr = api.defineAggregate();

          aggr.defineEvent({
            name: 'evtName'
          });

          aggr.addEvent({ name: 'evt1', version: 0, apply: function () {} });
          aggr.addEvent({ name: 'evt2', version: 0, apply: function () {} });
          aggr.addEvent({ name: 'evt2', version: 1, apply: function () {} });
          aggr.addEvent({ name: 'evt2', version: 2, apply: function () {} });
          aggr.addEvent({ name: 'evt3', version: 0, apply: function () {} });

          expect(function () {
            aggr.apply([{ name: 'evt1' }]);
          }).to.throwError(/name/);

        });

      });

      describe('without having defined an event that handles it', function () {

        it('it should throw an error', function () {

          var aggr = api.defineAggregate();

          aggr.defineEvent({
            name: 'evtName'
          });

          aggr.addEvent({ name: 'evt1', version: 0, apply: function () {} });
          aggr.addEvent({ name: 'evt2', version: 0, apply: function () {} });
          aggr.addEvent({ name: 'evt2', version: 1, apply: function () {} });
          aggr.addEvent({ name: 'evt2', version: 2, apply: function () {} });
          aggr.addEvent({ name: 'evt3', version: 0, apply: function () {} });

          expect(function () {
            aggr.apply([{ evtName: 'evt1NotExisting' }]);
          }).to.throwError(/not found/);

        });

      });

      describe('having defined an event that handles it', function () {

        it('it should not throw an error', function () {

          var aggr = api.defineAggregate();

          aggr.defineEvent({
            name: 'evtName'
          });

          aggr.addEvent({ name: 'evt1', version: 0, apply: function () {} });
          aggr.addEvent({ name: 'evt2', version: 0, apply: function () {} });
          aggr.addEvent({ name: 'evt2', version: 1, apply: function () {} });
          aggr.addEvent({ name: 'evt2', version: 2, apply: function () {} });
          aggr.addEvent({ name: 'evt3', version: 0, apply: function () {} });

          expect(function () {
            aggr.apply([{ evtName: 'evt2' }]);
          }).not.to.throwError();

        });

        it('it should not throw an error', function (done) {

          var aggr = api.defineAggregate();

          aggr.defineEvent({
            name: 'evtName',
            version: 'v'
          });

          var checked = 0;

          function check () {
            checked++;
            if (checked === 2) {
              done();
            }
          }

          aggr.addEvent({ name: 'evt1', version: 0, apply: function () {} });
          aggr.addEvent({ name: 'evt2', version: 0, apply: function () {} });
          aggr.addEvent({ name: 'evt2', version: 1, apply: function (evt, aggModel) {
            expect(evt.evtName).to.eql('evt2');
            expect(evt.v).to.eql(1);
            expect(aggModel).to.eql('model');
            check();
          } });
          aggr.addEvent({ name: 'evt2', version: 2, apply: function () {} });
          aggr.addEvent({ name: 'evt3', version: 0, apply: function (evt, aggModel) {
            expect(evt.evtName).to.eql('evt3');
            expect(evt.v).to.eql(0);
            expect(aggModel).to.eql('model');
            check();
          } });

          aggr.apply([{ evtName: 'evt2', v: 1 }, { evtName: 'evt3', v: 0 }], 'model');

        });

      });

    });

    describe('calling loadFromHistory', function () {

      describe('passing more events than threshold', function () {

        it('it should work as expected', function () {

          var evts = [{ evtName: 'evt1' }, { evtName: 'evt2' }, { evtName: 'evt3' }];
          var aggModel = {
            set: function () {},
            setRevision: function () {},
            toJSON: function () { return 'json'; }
          };

          var aggr = api.defineAggregate();
          aggr.defineSnapshotNeed(function (time, evts, model) {
            return evts.length >= 2;
          });

          aggr.apply = function (events, aggregateModel) { // mock
            expect(events).to.eql(evts);
            expect(aggregateModel).to.eql(aggModel);
          };

          aggr.defineEvent({
            name: 'evtName'
          });

          var res = aggr.loadFromHistory(aggModel, null, evts, 4, {});

          expect(res).to.eql(true);

        });

      });

      describe('passing less events than threshold', function () {

        it('it should work as expected', function () {

          var evts = [{ evtName: 'evt1' }, { evtName: 'evt2' }, { evtName: 'evt3' }];
          var aggModel = {
            set: function () {},
            setRevision: function () {},
            toJSON: function () { return 'json'; }
          };

          var aggr = api.defineAggregate();

          aggr.apply = function (events, aggregateModel) { // mock
            expect(events).to.eql(evts);
            expect(aggregateModel).to.eql(aggModel);
          };

          aggr.defineEvent({
            name: 'evtName'
          });

          var res = aggr.loadFromHistory(aggModel, null, evts, 4, {});

          expect(res).to.eql(false);

        });

      });

      describe('passing a snapshot', function () {

        describe('with actual version', function () {

          it('it should work as expected', function () {

            var snap = {
              version: 4,
              revision: 5,
              data: {
                my: { da: 'ta' }
              }
            };

            var aggModel = {
              set: function (d) {
                expect(d).to.eql(snap.data);
              },
              setRevision: function (info, r) {
                expect(r).to.eql(6);
              }
            };

            var aggr = api.defineAggregate({ version: 4 });
            aggr.context = { name: undefined };

            aggr.defineSnapshotNeed(function (time, evts, model) {
              return evts.length >= 2;
            });

            var res = aggr.loadFromHistory(aggModel, snap, null, 4, {});

            expect(res).to.eql(false);

          });

        });

        describe('with older version', function () {

          it('it should work as expected', function () {

            var snap = {
              version: 1,
              revision: 5,
              data: {
                my: { da: 'ta' }
              }
            };

            var aggModel = {
              set: function () {
              },
              setRevision: function (info, r) {
                expect(r).to.eql(6);
              }
            };

            var aggr = api.defineAggregate({ version: 4 });

            aggr.defineSnapshotConversion({ version: 1 }, function (data, aggregateModel) {
              expect(data).to.eql(snap.data);
              expect(aggregateModel).to.eql(aggModel);
            });

            aggr.defineSnapshotNeed(function (time, evts, model) {
              return evts.length >= 2;
            });
            aggr.defineContext({ name: undefined });

            var res = aggr.loadFromHistory(aggModel, snap, null, 4, {});

            expect(res).to.eql(true);

          });

        });

      });

      describe('passing some events', function () {

        it('it should actualize the aggregateModel correctly', function () {

          var evts = [{ evtName: 'evt1', r: 3 }, { evtName: 'evt2', r: 1 }, { evtName: 'evt3', r: 2 }];
          var rev;
          var aggModel = {
            set: function () {},
            setRevision: function (info, r) { rev = r;},
            toJSON: function () { return 'json'; }
          };

          var aggr = api.defineAggregate();

          aggr.apply = function (events, aggregateModel) { // mock
            expect(events).to.eql(evts);
            expect(aggregateModel).to.eql(aggModel);
            expect(aggregateModel).to.eql(aggModel);
          };
          aggr.defineSnapshotNeed(function (time, evts, model) {
            return evts.length >= 2;
          });

          aggr.defineEvent({
            name: 'evtName',
            revision: 'r'
          });
          aggr.context = { name: undefined };

          aggr.loadFromHistory(aggModel, null, evts, 4, {});

          expect(rev).to.eql(3);

        });

        it('it should not set revision when persistance is disabled', function () {

          var evts = [{ evtName: 'nonPersistant'}];
          var rev = null;
          var aggModel = {
            set: function () {},
            setRevision: function (info, r) { rev = r;},
            toJSON: function () { return 'json'; }
          };

          var aggr = api.defineAggregate({
            skipHistory: true,
            applyLastEvent: true,
            disablePersistence: true
          });

          aggr.apply = function (evts, aggregateModel) { // mock
            expect(events).to.eql(evts);
            expect(aggregateModel).to.eql(aggModel);
            expect(aggregateModel).to.eql(aggModel);
          };

          expect(rev).to.eql(null);

        });

    });
    
      describe('passing a snapshot and some events', function () {

        it('it should actualize the aggregateModel correctly', function () {

          var evts = [{ evtName: 'evt1', r: 6 }, { evtName: 'evt2', r: 7 }, { evtName: 'evt3', r: 8 }];
          var snap = {
            version: 1,
            revision: 5,
            data: {
              my: { da: 'ta' }
            }
          };

          var rev;
          var aggModel = {
            set: function () {
            },
            setRevision: function (info, r) {
              rev = r;
            },
            toJSON: function () { return 'json'; }
          };

          var aggr = api.defineAggregate({ version: 4 });

          aggr.defineSnapshotConversion({ version: 1 }, function (data, aggregateModel) {
            expect(data).to.eql(snap.data);
            expect(aggregateModel).to.eql(aggModel);
          });
          aggr.defineSnapshotNeed(function (time, evts, model) {
            return evts.length >= 2;
          });

          aggr.apply = function (events, aggregateModel) { // mock
            expect(events).to.eql(evts);
            expect(aggregateModel).to.eql(aggModel);
            expect(aggregateModel).to.eql(aggModel);
          };

          aggr.defineEvent({
            name: 'evtName',
            revision: 'r'
          });

          aggr.defineContext({ name: undefined });

          aggr.loadFromHistory(aggModel, null, evts, 4, {});

          expect(rev).to.eql(8);

        });

      });

    });

    describe('calling handle', function () {

      describe('passing a command object that not have a name', function () {

        it('it should callback with an Error', function () {

          var aggModel = {
            get: function () {
            }
          };

          var aggr = api.defineAggregate();

          aggr.defineCommand({
            name: 'cmdName'
          });

          aggr.handle(aggModel, { my: 'cmd', with: 'payload' }, function (err) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/name/);
          });

        });

      });

      describe('passing a command object that not matches an existing command', function () {

        it('it should callback with an Error', function () {

          var aggModel = {
            get: function () {
            }
          };

          var aggr = api.defineAggregate();

          aggr.defineCommand({
            name: 'cmdName'
          });

          aggr.handle(aggModel, { cmdName: 'cmd', with: 'payload' }, function (err) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/not found/);
          });

        });

      });

      describe('passing a command object that matches an existing command', function () {

        it('it should not callback with an Error', function (done) {

          var rev = 0;
          var uncommittedEvts = [];
          var applyCalled = false;
          var aggModel = {
            id: 'aggId',
            set: function (k, v) {
              expect(k).to.eql('applied');
              expect(v).to.eql(true);
            },
            get: function () {
            },
            setRevision: function (info, r) { rev = r; },
            getRevision: function () { return rev; },
            toJSON: function () {},
            addUncommittedEvent: function (e) { uncommittedEvts.push(e); },
            getUncommittedEvents: function () { return uncommittedEvts; }
          };

          var cmdToUse = { cmdName: 'cmd', v: 2, with: 'payload' };

          var aggr = api.defineAggregate();

          aggr.defineCommand({
            name: 'cmdName',
            version: 'v'
          });

          aggr.defineEvent({
            name: 'evtName',
            version: 'v'
          });
          aggr.defineContext({ name: undefined });

          var pcCalled = false;
          var checkPreConditions = function (cmd, aggregateModel, clb) {
            expect(cmd).to.eql(cmdToUse);
            expect(aggregateModel).to.eql(aggModel);
            expect(aggregateModel.apply).not.to.be.ok();
            pcCalled = true;
            clb(null);
          };

          var handle = function (cmd, aggregateModel) {
            expect(cmd).to.eql(cmdToUse);
            expect(aggregateModel).to.eql(aggModel);
            expect(function () {
              aggregateModel.set();
            }).to.throwError();
            aggregateModel.apply({ evtName: 'evt', with: 'payloadOfEvt' });
          };

          aggr.addCommand({ name: 'cmd', version: 2, defineAggregate: function () {}, validate: function () { return null; }, handle: handle, checkPreConditions: checkPreConditions });

          aggr.addEvent({ name: 'evt', version: 0, apply: function (e, a) {
            a.set('applied', true);
            applyCalled = true;
          }});

          aggr.handle(aggModel, cmdToUse, function (err) {
            expect(err).not.to.be.ok();
            expect(rev).to.eql(1);
            expect(pcCalled).to.eql(true);
            expect(applyCalled).to.eql(true);

            done();
          });
        });

        it('it should work as expected', function () {

          var evts = [];
          var rev = 3;

          var aggModel = {
            id: 'myAggId',
            toJSON: function () {},
            getRevision: function () {
              return rev;
            },
            setRevision: function (i, r) {
              rev = r;
            },
            addUncommittedEvent: function (e) { evts.push(e); },
            getUncommittedEvents: function () { return evts; }
          };

          var cmdToUse = { cmdId: '111222333', cmdName: 'cmd', v: 2, with: 'payload', head: { m: 'mmm' } };

          var aggr = api.defineAggregate({ name: 'aggName' });

          aggr.defineContext({ name: 'ctxName' });

          aggr.defineCommand({
            name: 'cmdName',
            id: 'cmdId',
            version: 'v',
            aggregate: 'aName',
            context: 'c',
            meta: 'head.m'
          });

          aggr.defineEvent({
            name: 'evtName',
            version: 'v',
            id: 'iii',
            correlationId: 'commandId',
            revision: 'r',
            payload: 'p',
            aggregateId: 'a',
            aggregate: 'aName',
            context: 'c',
            meta: 'p.m'
          });

          var pcCalled = false;
          var checkPreConditions = function (cmd, aggregateModel, clb) {
            expect(cmd).to.eql(cmdToUse);
            expect(aggregateModel).to.eql(aggModel);
            expect(aggregateModel.apply).not.to.be.ok();
            pcCalled = true;
            clb(null);
          };

          var handleCalled = false;
          var handle = function (cmd, aggregateModel) {
            expect(cmd).to.eql(cmdToUse);
            expect(aggregateModel).to.eql(aggModel);
            aggregateModel.apply('evt1', { value: 'data1' });
            aggregateModel.apply({ evtName: 'evt2', p: { value: 'data2' } });
            aggregateModel.apply('evt3');
            aggregateModel.apply('evt4', { value: 'data4' }, 3);
            handleCalled = true;
          };

          var checkBRCalled = false;
          var tmpFn = aggr.checkBusinessRules;
          aggr.checkBusinessRules = function (changed, previous, events, command, callback) { // mock
            checkBRCalled = true;
            tmpFn.call(aggr, changed, previous, events, command, callback);
          };

          aggr.addCommand({ name: 'cmd', version: 2, defineAggregate: function () {}, validate: function () { return null; }, handle: handle, checkPreConditions: checkPreConditions });
          aggr.addEvent({ name: 'evt1', version: 0, apply: function (e, a) {}});
          aggr.addEvent({ name: 'evt2', version: 0, apply: function (e, a) {}});
          aggr.addEvent({ name: 'evt3', version: 0, apply: function (e, a) {}});
          aggr.addEvent({ name: 'evt4', version: 0, apply: function (e, a) {}});
          aggr.addEvent({ name: 'evt4', version: 3, apply: function (e, a) {}});
          aggr.addEvent({ name: 'evt4', version: 4, apply: function (e, a) {}});

          aggr.handle(aggModel, cmdToUse, function (err) {
            expect(err).not.to.be.ok();
            expect(pcCalled).to.eql(true);
            expect(handleCalled).to.eql(true);

            expect(evts[0].evtName).to.eql('evt1');
            expect(evts[0].iii).to.be.a('string');
            expect(evts[0].v).to.eql(0);
            expect(evts[0].r).to.eql(4);
            expect(evts[0].p.value).to.eql('data1');
            expect(evts[0].commandId).to.eql(cmdToUse.cmdId);
            expect(evts[0].a).to.eql('myAggId');
            expect(evts[0].aName).to.eql('aggName');
            expect(evts[0].c).to.eql('ctxName');
            expect(evts[0].p.m).to.eql('mmm');

            expect(evts[1].evtName).to.eql('evt2');
            expect(evts[1].iii).to.be.a('string');
            expect(evts[1].iii).not.to.eql(evts[0].iii);
            expect(evts[1].v).to.eql(0);
            expect(evts[1].r).to.eql(5);
            expect(evts[1].p.value).to.eql('data2');
            expect(evts[1].commandId).to.eql(cmdToUse.cmdId);
            expect(evts[1].a).to.eql('myAggId');
            expect(evts[1].aName).to.eql('aggName');
            expect(evts[1].c).to.eql('ctxName');
            expect(evts[1].p.m).to.eql('mmm');

            expect(evts[2].evtName).to.eql('evt3');
            expect(evts[2].iii).to.be.a('string');
            expect(evts[2].iii).not.to.eql(evts[1].iii);
            expect(evts[2].v).to.eql(0);
            expect(evts[2].r).to.eql(6);
            expect(evts[2].commandId).to.eql(cmdToUse.cmdId);
            expect(evts[2].a).to.eql('myAggId');
            expect(evts[2].aName).to.eql('aggName');
            expect(evts[2].c).to.eql('ctxName');
            expect(evts[2].p.m).to.eql('mmm');

            expect(evts[3].evtName).to.eql('evt4');
            expect(evts[3].iii).to.be.a('string');
            expect(evts[3].v).to.eql(3);
            expect(evts[3].r).to.eql(7);
            expect(evts[3].p.value).to.eql('data4');
            expect(evts[3].commandId).to.eql(cmdToUse.cmdId);
            expect(evts[3].a).to.eql('myAggId');
            expect(evts[3].aName).to.eql('aggName');
            expect(evts[3].c).to.eql('ctxName');
            expect(evts[3].p.m).to.eql('mmm');

            expect(rev).to.eql(7);

            expect(checkBRCalled).to.eql(true);
          });

        });

        describe('if business rules fails', function () {

          it('it should work as expected', function () {

            var evts = [];
            var prevValues = { '_revision': 3 };

            var aggModel = new AggregateModel('myAggId', prevValues);
            aggModel.reset = function (r) {
              if (r.attributes) {
                prevValues = r.attributes;
              } else {
                prevValues = r;
              }
            };
            aggModel.set = function (v) {
              prevValues = v;
            };
            aggModel.toJSON = function () {
              return _.cloneDeep(prevValues);
            };
            aggModel.getRevision = function () {
              return prevValues['_revision'];
            };
            aggModel.setRevision = function (r) {
              prevValues['_revision'] = r;
            };
            aggModel.addUncommittedEvent = function (e) { evts.push(e); };
            aggModel.getUncommittedEvents = function () { return evts; };
            aggModel.clearUncommittedEvents = function () { evts = []; };

            var cmdToUse = { cmdId: '111222333', cmdName: 'cmd', v: 2, with: 'payload', head: { m: 'mmm' } };

            var aggr = api.defineAggregate({ name: 'aggName', defaultPreConditionPayload: 'with' });

            aggr.defineContext({ name: 'ctxName' });

            aggr.defineCommand({
              name: 'cmdName',
              id: 'cmdId',
              version: 'v',
              aggregate: 'aName',
              context: 'c',
              meta: 'head.m'
            });

            aggr.defineEvent({
              name: 'evtName',
              version: 'v',
              id: 'iii',
              correlationId: 'commandId',
              revision: 'r',
              payload: 'p',
              aggregateId: 'a',
              aggregate: 'aName',
              context: 'c',
              meta: 'p.m'
            });

            var pcCalled = false;
            var checkPreConditions = function (cmd, aggregateModel, clb) {
              expect(cmd).to.eql(cmdToUse);
              expect(aggregateModel).to.eql(aggModel);
              expect(aggregateModel.apply).not.to.be.ok();
              pcCalled = true;
              clb(null);
            };

            var handleCalled = false;
            var handle = function (cmd, aggregateModel) {
              expect(cmd).to.eql(cmdToUse);
              expect(aggregateModel).to.eql(aggModel);
              aggregateModel.apply('evt1', { value: 'data1' });
              aggregateModel.apply({ evtName: 'evt2', p: { value: 'data2' } });
              aggregateModel.apply('evt3');
              handleCalled = true;
            };

            var checkBRCalled = false;
            var tmpFn = aggr.checkBusinessRules;
            aggr.checkBusinessRules = function (changed, previous, events, command, callback) { // mock
              checkBRCalled = true;
              callback('err');
            };

            var defineAggregateCalled = false;
            var defineAggregate = function (a) {
              expect(a).to.eql(aggr);
              defineAggregateCalled = true;
            };

            aggr.addCommand({ name: 'cmd', version: 2, validate: function () { return null; }, handle: handle, checkPreConditions: checkPreConditions, defineAggregate: defineAggregate });
            aggr.addEvent({ name: 'evt1', version: 0, apply: function (e, a) {}});
            aggr.addEvent({ name: 'evt2', version: 0, apply: function (e, a) {}});
            aggr.addEvent({ name: 'evt3', version: 0, apply: function (e, a) {}});

            aggr.handle(aggModel, cmdToUse, function (err) {
              expect(err).to.be.ok();
              expect(err).to.eql('err');

              expect(defineAggregateCalled).to.eql(true);
              expect(pcCalled).to.eql(true);
              expect(handleCalled).to.eql(true);
              expect(prevValues._revision).to.eql(3);
              expect(evts.length).to.eql(0);
              expect(checkBRCalled).to.eql(true);
            });

          });

        });

      });

    });

  });

});
