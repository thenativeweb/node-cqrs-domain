var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../../lib/definitionBase'),
  Aggregate = require('../../lib/definitions/aggregate'),
  DefaultCommandHandler = require('../../lib/defaultCommandHandler'),
  AggregateModel = require('../../lib/aggregateModel'),
  api = require('../../');

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

      expect(aggr.idGenerator).to.be.a('function');
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

          var aggr = api.defineAggregate();
          var fn1 = function () {};
          var fn2 = function () {};
          aggr.defineSnapshotConversion({ version: 2 }, fn1);
          aggr.defineSnapshotConversion({ version: 3 }, fn2);
          expect(aggr.snapshotConversions[2]).to.eql(fn1);
          expect(aggr.snapshotConversions[3]).to.eql(fn2);

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
            var id = require('node-uuid').v4().toString();
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
              var id = require('node-uuid').v4().toString();
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

          aggr.addCommand({ name: 'myCommand' });

          expect(aggr.commands.length).to.eql(1);
          expect(aggr.commands[0].name).to.eql('myCommand');

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

          aggr.addBusinessRule({ name: 'myRule' });

          expect(aggr.businessRules.length).to.eql(1);
          expect(aggr.businessRules[0].name).to.eql('myRule');

        });

      });

      describe('working with priority', function () {

        it('it should order it correctly', function () {

          var aggr = api.defineAggregate();

          aggr.addBusinessRule({ name: 'myRule2', priority: 3 });
          aggr.addBusinessRule({ name: 'myRule4', priority: Infinity });
          aggr.addBusinessRule({ name: 'myRule1', priority: 1 });
          aggr.addBusinessRule({ name: 'myRule3', priority: 5 });

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
        aggr.addCommand({ name: 'cmd1', version: 0 });
        aggr.addCommand({ name: 'cmd2', version: 0 });
        aggr.addCommand({ name: 'cmd2', version: 1 });
        aggr.addCommand({ name: 'cmd2', version: 2 });
        aggr.addCommand({ name: 'cmd3', version: 0 });
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
      
    });
    
    describe('calling validateCommand', function () {
      
      describe('passing a command object that not have a name', function () {
        
        it('it should throw an Error', function () {

          var aggr = api.defineAggregate();

          aggr.defineCommand({
            name: 'cmdName'
          });
          
          expect(function () {
            aggr.validateCommand({ my: 'cmd', with: 'payload' });
          }).to.throwError(/name/);
          
        });
        
      });

      describe('passing a command object that not matches an existing command', function () {

        it('it should throw an Error', function () {

          var aggr = api.defineAggregate();

          aggr.defineCommand({
            name: 'cmdName'
          });

          expect(function () {
            aggr.validateCommand({ cmdName: 'cmd', with: 'payload' });
          }).to.throwError(/not found/);

        });

      });

      describe('passing a command object that matches an existing command', function () {

        it('it should not throw an Error', function () {

          var aggr = api.defineAggregate();

          aggr.defineCommand({
            name: 'cmdName',
            version: 'v'
          });
          
          aggr.addCommand({ name: 'cmd', version: 2, validate: function () { return null; } });

          expect(function () {
            aggr.validateCommand({ cmdName: 'cmd', v: 2, with: 'payload' });
          }).not.to.throwError();

        });

        it('it should return what the command validation function returns', function () {

          var aggr = api.defineAggregate();

          aggr.defineCommand({
            name: 'cmdName',
            version: 'v'
          });

          aggr.addCommand({ name: 'cmd', version: 2, validate: function () { return 'myValidationRes'; } });

          var err = aggr.validateCommand({ cmdName: 'cmd', v: 2, with: 'payload' });
          expect(err).to.eql('myValidationRes')
          
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
          }
        };

        var br2 = {
          check: function (changed, previous, events, command, callback) {
            expect(changed).to.eql(ch);
            expect(previous).to.eql(pr);
            expect(events).to.eql(evt);
            expect(command).to.eql(cmd);
            called++;
            callback(null);
          }
        };

        aggr.addBusinessRule(br1);
        aggr.addBusinessRule(br2);
        
        aggr.checkBusinessRules(ch, pr, evt, cmd, done);
        
      });
      
    });
    
    describe('calling isSnapshotNeeded', function () {
      
      describe('passing more events than threshold', function () {

        it('it should work as expected', function () {

          var aggr = api.defineAggregate({ snapshotThreshold: 2 });

          var res = aggr.isSnapshotNeeded([1, 2, 3, 4]);
          
          expect(res).to.eql(true);

        });
        
      });

      describe('passing less events than threshold', function () {

        it('it should work as expected', function () {

          var aggr = api.defineAggregate();
          
          expect(aggr.getSnapshotThreshold()).to.eql(100); // default

          var res = aggr.isSnapshotNeeded([1, 2, 3, 4]);

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
    
    describe('calling loadFromHistory');

    describe('calling handle');
    
  });

});
