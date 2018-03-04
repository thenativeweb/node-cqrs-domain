var expect = require('expect.js'),
  DefaultCommandHandler = require('../../lib/defaultCommandHandler'),
  DefinitionBase = require('../../lib/definitionBase'),
  ConcurrencyError = require('../../lib/errors/concurrencyError');

describe('defaultCommandHandler', function () {

  describe('creating a new instance', function () {

    var cmdHnd;

    beforeEach(function () {
      cmdHnd = new DefaultCommandHandler();
    });

    it('it should return a correct object', function () {

      expect(cmdHnd).to.be.a(DefinitionBase);
      expect(cmdHnd.id).to.be.a('string');
      expect(cmdHnd.definitions).to.be.an('object');
      expect(cmdHnd.definitions.command).to.be.an('object');
      expect(cmdHnd.definitions.event).to.be.an('object');
      expect(cmdHnd.defineCommand).to.be.a('function');
      expect(cmdHnd.defineEvent).to.be.a('function');
      expect(cmdHnd.defineOptions).to.be.a('function');

      expect(cmdHnd.useAggregate).to.be.a('function');
      expect(cmdHnd.useEventStore).to.be.a('function');
      expect(cmdHnd.useAggregateLock).to.be.a('function');
      expect(cmdHnd.queueCommand).to.be.a('function');
      expect(cmdHnd.getNextCommandInQueue).to.be.a('function');
      expect(cmdHnd.lockAggregate).to.be.a('function');
      expect(cmdHnd.loadAggregate).to.be.a('function');
      expect(cmdHnd.createSnapshot).to.be.a('function');
      expect(cmdHnd.isAggregateDestroyed).to.be.a('function');
      expect(cmdHnd.isRevisionWrong).to.be.a('function');
      expect(cmdHnd.validateCommand).to.be.a('function');
      expect(cmdHnd.checkPreLoadConditions).to.be.a('function');
      expect(cmdHnd.verifyAggregate).to.be.a('function');
      expect(cmdHnd.letHandleCommandByAggregate).to.be.a('function');
      expect(cmdHnd.checkAggregateLock).to.be.a('function');
      expect(cmdHnd.resolveAggregateLock).to.be.a('function');
      expect(cmdHnd.commit).to.be.a('function');
      expect(cmdHnd.workflow).to.be.a('function');
      expect(cmdHnd.handle).to.be.a('function');

    });

    describe('calling useAggregate', function () {

      it('it should work as expected', function () {

        var aggregate = { agg: 'regate' };
        cmdHnd.useAggregate(aggregate);
        expect(cmdHnd.aggregate).to.eql(aggregate);

      });

    });

    describe('calling useEventStore', function () {

      it('it should work as expected', function () {

        var eventstore = { event: 'store' };
        cmdHnd.useEventStore(eventstore);
        expect(cmdHnd.eventStore).to.eql(eventstore);

      });

    });

    describe('calling useEventStore', function () {

      it('it should work as expected', function () {

        var aggLock = { agg: 'lock' };
        cmdHnd.useAggregateLock(aggLock);
        expect(cmdHnd.aggregateLock).to.eql(aggLock);

      });

    });

    describe('calling queueCommand', function () {

      it('it should work as expected', function () {

        cmdHnd.defineCommand({
          aggregateId: 'aggId'
        });
        var cmd = { my: 'cmd', aggId: '123' };
        var clb = function () {};
        cmdHnd.queueCommand('123', cmd, clb);
        var cmd2 = { my: 'cmd2', aggId: '12345' };
        var clb2 = function () {};
        cmdHnd.queueCommand('12345', cmd2, clb2);
        var cmd3 = { my: 'cmd3', aggId: '123' };
        var clb3 = function () {};
        cmdHnd.queueCommand('123', cmd3, clb3);
        expect(cmdHnd.queue['123']).to.be.an('array');
        expect(cmdHnd.queue['123'].length).to.eql(2);
        expect(cmdHnd.queue['123'][0].command).to.eql(cmd);
        expect(cmdHnd.queue['123'][0].callback).to.eql(clb);
        expect(cmdHnd.queue['123'][1].command).to.eql(cmd3);
        expect(cmdHnd.queue['123'][1].callback).to.eql(clb3);
        expect(cmdHnd.queue['12345']).to.be.an('array');
        expect(cmdHnd.queue['12345'].length).to.eql(1);
        expect(cmdHnd.queue['12345'][0].command).to.eql(cmd2);
        expect(cmdHnd.queue['12345'][0].callback).to.eql(clb2);

      });

    });

    describe('calling getNextCommandInQueue', function () {

      it('it should work as expected', function () {

        cmdHnd.defineCommand({
          aggregateId: 'aggId'
        });
        var cmd = { my: 'cmd', aggId: '123' };
        var clb = function () {};
        cmdHnd.queueCommand('123', cmd, clb);
        var cmd2 = { my: 'cmd2', aggId: '12345' };
        var clb2 = function () {};
        cmdHnd.queueCommand('12345', cmd2, clb2);
        var cmd3 = { my: 'cmd3', aggId: '123' };
        var clb3 = function () {};
        cmdHnd.queueCommand('123', cmd3, clb3);

        var next = cmdHnd.getNextCommandInQueue('123');

        expect(cmdHnd.queue['123']).to.be.an('array');
        expect(cmdHnd.queue['123'].length).to.eql(2);
        expect(next.command).to.eql(cmd);
        expect(next.callback).to.eql(clb);
        expect(cmdHnd.queue['123'][0].command).to.eql(cmd);
        expect(cmdHnd.queue['123'][0].callback).to.eql(clb);
        expect(cmdHnd.queue['123'][1].command).to.eql(cmd3);
        expect(cmdHnd.queue['123'][1].callback).to.eql(clb3);
        expect(cmdHnd.queue['12345']).to.be.an('array');
        expect(cmdHnd.queue['12345'].length).to.eql(1);
        expect(cmdHnd.queue['12345'][0].command).to.eql(cmd2);
        expect(cmdHnd.queue['12345'][0].callback).to.eql(clb2);

      });

    });

    describe('calling removeCommandFromQueue', function () {

      it('it should work as expected', function () {

        cmdHnd.defineCommand({
          aggregateId: 'aggId'
        });
        var cmd = { my: 'cmd', aggId: '123' };
        var clb = function () {};
        cmdHnd.queueCommand('123', cmd, clb);
        var cmd2 = { my: 'cmd2', aggId: '12345' };
        var clb2 = function () {};
        cmdHnd.queueCommand('12345', cmd2, clb2);
        var cmd3 = { my: 'cmd3', aggId: '123' };
        var clb3 = function () {};
        cmdHnd.queueCommand('123', cmd3, clb3);

        cmdHnd.removeCommandFromQueue('123', cmd);

        expect(cmdHnd.queue['123']).to.be.an('array');
        expect(cmdHnd.queue['123'].length).to.eql(1);
        expect(cmdHnd.queue['123'][0].command).to.eql(cmd3);
        expect(cmdHnd.queue['123'][0].callback).to.eql(clb3);
        expect(cmdHnd.queue['12345']).to.be.an('array');
        expect(cmdHnd.queue['12345'].length).to.eql(1);
        expect(cmdHnd.queue['12345'][0].command).to.eql(cmd2);
        expect(cmdHnd.queue['12345'][0].callback).to.eql(clb2);

      });

    });

    describe('calling lockAggregate', function () {

      it('it should work as expected', function (done) {

        var calledBack = false;
        var aggLock = {
          reserve: function (workerId, aggregateId, callback) {
            expect(workerId).to.be.a('string');
            expect(workerId).to.eql(cmdHnd.id);
            expect(aggregateId).to.eql('myAggId');
            calledBack = true;
            callback(null);
          }
        };
        cmdHnd.useAggregateLock(aggLock);

        cmdHnd.lockAggregate('myAggId', function (err) {
          expect(err).not.to.be.ok();
          expect(calledBack).to.eql(true);
          done();
        });

      });

    });

    describe('calling loadAggregate', function () {

      it('it should work as expected', function (done) {

        var snap = { version: 2, data: 'my data' };
        var stream = { events: [ { payload: { name: 'my-name', the: 'event' } } ] };
        var calledBackSnap = false;
        var calledLoad = false;
        var eventStore = {
          getFromSnapshot: function (query, callback) {
            setTimeout(function () {
              expect(query.aggregateId).to.eql('myAggId');
              expect(query.aggregate).to.eql('aggName');
              expect(query.context).to.eql('ctx');
              calledBackSnap = true;
              callback(null, snap, stream);
            }, 6);
          }
        };
        cmdHnd.defineCommand({
          aggregate: 'agg',
          context: 'c'
        });

        var firstTime = true;
        cmdHnd.useEventStore(eventStore);
        cmdHnd.useAggregate({ name: 'aggName',
          context: { name: 'ctx' },
          loadingSnapshotTransformers: {},
          getLoadingEventTransformer: function () {},
          create: function (id) { return { id: id }; },
          loadFromHistory: function (aggregate, snapshot, events, time) {
            if (firstTime) {
              expect(aggregate.id).to.eql('myAggId');
              expect(snapshot.data).to.eql('my data');
              expect(events.length).to.eql(0);
              expect(time).to.be.greaterThan(5);

              firstTime = false;
            } else {
              expect(aggregate.id).to.eql('myAggId');
              expect(snapshot).not.to.be.ok();
              expect(events.length).to.eql(1);
              expect(events[0]).to.eql(stream.events[0].payload);
              expect(time).to.be.greaterThan(5);
            }

            calledLoad = true;
            return false;
          },
          shouldIgnoreSnapshot: function (snapshot) {
            expect(snapshot.data).to.eql('my data');
            return false;
          },
          getLoadInfo: function (cmd) {
            return [{ context: 'ctx', aggregate: 'aggName' }];
          }
        });

        cmdHnd.loadAggregate({}, 'myAggId', function (err) {
          expect(err).not.to.be.ok();
          expect(calledBackSnap).to.eql(true);
          expect(calledLoad).to.eql(true);
          done();
        });

      });

      describe('ignoring loading of snapshot', function () {

        it('it should work as expected', function (done) {

          var snap = { version: 2, data: 'my data' };
          var stream = { events: [ { payload: { name: 'my-event', the: 'event' }, streamRevision: 1, id: 'id2' } ] };
          var streamAll = { events: [ { payload: { name: 'my-event',  the: 'eventOld' }, streamRevision: 0, id: 'id1' }, { payload: { name: 'my-event',  the: 'event' }, streamRevision: 1, id: 'id2' } ] };
          var calledBackSnap = false;
          var calledLoad = false;
          var eventStore = {
            getFromSnapshot: function (query, callback) {
              setTimeout(function () {
                expect(query.aggregateId).to.eql('myAggId');
                expect(query.aggregate).to.eql('aggName');
                expect(query.context).to.eql('ctx');
                calledBackSnap = true;
                callback(null, snap, stream);
              }, 6);
            },
            getEventStream: function (query, callback) {
              setTimeout(function () {
                expect(query.aggregateId).to.eql('myAggId');
                expect(query.aggregate).to.eql('aggName');
                expect(query.context).to.eql('ctx');
                calledBackSnap = true;
                callback(null, streamAll);
              }, 10);
            }
          };
          cmdHnd.defineCommand({
            aggregate: 'agg',
            context: 'c'
          });

          var firstTime = true;
          cmdHnd.useEventStore(eventStore);
          cmdHnd.useAggregate({ name: 'aggName',
            context: { name: 'ctx' },
            loadingSnapshotTransformers: {},
            getLoadingEventTransformer: function () {},
            create: function (id) { return { id: id }; },
            loadFromHistory: function (aggregate, snapshot, events, time) {
            if (firstTime) {
              expect(aggregate.id).to.eql('myAggId');
              expect(snapshot).not.to.be.ok();
              expect(events.length).to.eql(2);
              expect(time).to.be.greaterThan(5);

              firstTime = false;
            } else {
              expect(aggregate.id).to.eql('myAggId');
              expect(snapshot).not.to.be.ok();
              expect(events.length).to.eql(2);
              expect(events[1]).to.eql(stream.events[0].payload);
              expect(time).to.be.greaterThan(5);
            }

            calledLoad = true;
            return false;
          },
          getLoadInfo: function (cmd) {
            return [{ context: 'ctx', aggregate: 'aggName' }];
          },
            shouldIgnoreSnapshot: function (snapshot) {
              expect(snapshot.data).to.eql('my data');
              return true;
            }
          });

          cmdHnd.loadAggregate({}, 'myAggId', function (err) {
            expect(err).not.to.be.ok();
            expect(calledBackSnap).to.eql(true);
            expect(calledLoad).to.eql(true);
            done();
          });

        });

      });

    });

    describe('calling createSnapshot', function () {

      it('it should work as expected', function (done) {

        var aggr = {
          id: 'myAggId',
          toJSON: function () {
            return { a: 'b' };
          }
        };
        var stream = { lastRevision: 3, events: [ { payload: { the: 'event' } } ] };
        var calledBackSnap = false;
        var eventStore = {
          createSnapshot: function (query, callback) {
            expect(query.aggregateId).to.eql('myAggId');
            expect(query.aggregate).to.eql('aggName');
            expect(query.context).to.eql('ctx');
            expect(query.data.a).to.eql('b');
            expect(query.revision).to.eql(3);
            expect(query.version).to.eql(2);
            calledBackSnap = true;
            callback(null);
          }
        };
        cmdHnd.defineCommand({
          aggregate: 'agg',
          context: 'c'
        });
        cmdHnd.useEventStore(eventStore);
        cmdHnd.useAggregate({ name: 'aggName',
          context: { name: 'ctx' },
          version: 2,
          committingSnapshotTransformers: {}
        });

        cmdHnd.createSnapshot(aggr, stream, function (err) {
          expect(err).not.to.be.ok();
          expect(calledBackSnap).to.eql(true);
          done();
        });

      });

    });

    describe('calling isAggregateDestroyed', function () {

      describe('if false', function () {

        it('it should work as expected', function () {

          var aggr = {
            isDestroyed: function () {
              return false;
            }
          };

          var res = cmdHnd.isAggregateDestroyed(aggr, {});
          expect(res).to.eql(null);

        });

      });

      describe('if true', function () {

        it('it should work as expected', function () {

          var aggr = {
            id: '234',
            getRevision: function () {
              return 4;
            },
            isDestroyed: function () {
              return true;
            }
          };

          var res = cmdHnd.isAggregateDestroyed(aggr, {});
          expect(res.name).to.eql('AggregateDestroyedError');
          expect(res.more.aggregateId).to.eql('234');
          expect(res.more.aggregateRevision).to.eql(4);

        });

      });

    });

    describe('calling isRevisionWrong', function () {

      describe('without having defined a revision', function () {

        it('it should work as expected', function () {

          var aggr = {};
          var cmd = {};
          var res = cmdHnd.isRevisionWrong(aggr, cmd);
          expect(res).to.eql(null);

        });

      });

      describe('with a command revision is less then the aggregate revision', function () {

        it('it should work as expected', function () {

          var aggr = { id: '332', getRevision: function () { return 3; } };
          var cmd = { r: 2 };

          cmdHnd.defineCommand({
            revision: 'r'
          });

          var res = cmdHnd.isRevisionWrong(aggr, cmd);
          expect(res.name).to.eql('AggregateConcurrencyError');
          expect(res.more.aggregateId).to.eql('332');
          expect(res.more.aggregateRevision).to.eql(3);
          expect(res.more.commandRevision).to.eql(2);

        });

      });

      describe('with a command revision is greater then the aggregate revision', function () {

        it('it should work as expected', function () {

          var aggr = { id: '332', getRevision: function () { return 2; } };
          var cmd = { r: 3 };

          cmdHnd.defineCommand({
            revision: 'r'
          });

          var res = cmdHnd.isRevisionWrong(aggr, cmd);
          expect(res.name).to.eql('AggregateConcurrencyError');
          expect(res.more.aggregateId).to.eql('332');
          expect(res.more.aggregateRevision).to.eql(2);
          expect(res.more.commandRevision).to.eql(3);

        });

      });

      describe('with a command revision matching the aggregate revision', function () {

        it('it should work as expected', function () {

          var aggr = { id: '332', getRevision: function () { return 3; } };
          var cmd = { r: 3 };

          cmdHnd.defineCommand({
            revision: 'r'
          });

          var res = cmdHnd.isRevisionWrong(aggr, cmd);
          expect(res).to.eql(null);

        });

      });

    });

    describe('calling validateCommand', function () {

      it('it should work as expected', function (done) {

        var cmd = { my: 'cmd' };
        var aggr = {
          validateCommand: function (c, clb) {
            expect(c).to.eql(cmd);
            clb();
          }
        };
        cmdHnd.useAggregate(aggr);
        cmdHnd.validateCommand(cmd, function (error, result){ done() });

      });

    });

    describe('calling verifyAggregate', function () {

      it('it should work as expected', function () {

        var cmd = { my: 'cmd' };
        var aggr = { my: 'aggr' };

        cmdHnd.useAggregate({});

        cmdHnd.isAggregateDestroyed = function (a) {
          expect(a).to.eql(aggr);
          return null;
        };

        cmdHnd.isRevisionWrong = function (a, c) {
          expect(a).to.eql(aggr);
          expect(c).to.eql(cmd);
          return null;
        };

        cmdHnd.verifyAggregate(aggr, cmd);

      });

    });

    describe('calling letHandleCommandByAggregate', function () {

      it('it should work as expected', function (done) {

        var cmd = { my: 'cmd' };
        var aggr = { my: 'aggr' };
        var called = false;

        cmdHnd.useAggregate({
          handle: function (a, c, clb) {
            expect(a).to.eql(aggr);
            expect(c).to.eql(cmd);
            called = true;
            clb(null);
          }
        });
        cmdHnd.letHandleCommandByAggregate(aggr, cmd, function (err) {
          expect(err).not.to.be.ok();
          expect(called).to.eql(true);
          done();
        });

      });

    });

    describe('calling checkAggregateLock', function () {

      describe('having an error', function () {

        it('it should work as expected', function (done) {

          var called = false;

          cmdHnd.useAggregateLock({
            getAll: function (aggId, clb) {
              expect(aggId).to.eql('1234');
              called = true;
              clb('err');
            }
          });
          cmdHnd.checkAggregateLock('1234', function (err) {
            expect(err).to.eql('err');
            expect(called).to.eql(true);
            done();
          });

        });

      });

      describe('having more workers as expected', function () {

        it('it should work as expected', function (done) {

          var called = false;

          cmdHnd.useAggregateLock({
            getAll: function (aggId, clb) {
              expect(aggId).to.eql('1234');
              called = true;
              clb(null, [cmdHnd.id, '1111']);
            }
          });
          cmdHnd.checkAggregateLock('1234', function (err) {
            expect(err).to.be.a(ConcurrencyError);
            expect(called).to.eql(true);
            done();
          });

        });

      });

      describe('having exactly my worker', function () {

        it('it should work as expected', function (done) {

          var called = false;

          cmdHnd.useAggregateLock({
            getAll: function (aggId, clb) {
              expect(aggId).to.eql('1234');
              called = true;
              clb(null, [cmdHnd.id]);
            }
          });
          cmdHnd.checkAggregateLock('1234', function (err) {
            expect(err).not.to.be.ok();
            expect(called).to.eql(true);
            done();
          });

        });

      });

    });

    describe('calling resolveAggregateLock', function () {

      it('it should work as expected', function (done) {

        var called = false;

        cmdHnd.useAggregateLock({
          resolve: function (aggId, clb) {
            expect(aggId).to.eql('1234');
            called = true;
            clb(null);
          }
        });
        cmdHnd.resolveAggregateLock('1234', function (err) {
          expect(err).not.to.be.ok();
          expect(called).to.eql(true);
          done();
        });

      });

    });

    describe('calling commit', function () {

      it('it should work as expected', function (done) {

        var called = false;
        var evts = [{ payload: { name: 'my-event' }, my: 'first', context: 'c', aggregate: 'a', aggregateId: 'aId' }, { payload: { name: 'my-event' }, my: 'second', context: 'c', aggregate: 'a', aggregateId: 'aId' }];
        var agg = { getUncommittedEvents: function () { return evts; } };
        var stream = {
          eventsToDispatch: [],
          addEvents: function (u) {
            this.eventsToDispatch = u;
          },
          addEvent: function (u) {
            this.eventsToDispatch.push(u);
          },
          commit: function (clb) {
            called = true;
            clb(null, this);
          },
          context: 'c',
          aggregate: 'a',
          aggregateId: 'aId'
        };

        cmdHnd.useAggregate({ name: 'aggName', context: { name: 'ctxName' }, getLoadingEventTransformer: function () {} });

        cmdHnd.defineEvent({
          context: 'context',
          aggregate: 'aggregate',
          aggregateId: 'aggregateId'
        });

        cmdHnd.commit(agg, [stream], function (err, uncommitedEvts) {
          expect(err).not.to.be.ok();
          expect(uncommitedEvts).to.eql(evts);
          expect(called).to.eql(true);
          done();
        });

      });

    });

    describe('calling workflow', function () {

      it('it should work as expected', function (done) {

        var cmd = { my: 'cmd', aggId: '8931' };

        cmdHnd.defineCommand({
          aggregateId: 'aggId'
        });

        cmdHnd.useAggregate({ name: 'aggName', context: { name: 'ctxName' } });

        var step = 1;

        cmdHnd.validateCommand = function (c, clb) {
          expect(c).to.eql(cmd);
          expect(step).to.eql(1);
          step++;
          clb();
        };

        cmdHnd.checkPreLoadConditions = function (a, clb) {
          expect(step).to.eql(2);
          step++;
          clb(null);
        };

        cmdHnd.lockAggregate = function (a, clb) {
          expect(a).to.eql('8931');
          expect(step).to.eql(3);
          step++;
          clb(null);
        };

        cmdHnd.loadAggregate = function (cmd, a, clb) {
          expect(a).to.eql('8931');
          expect(step).to.eql(4);
          step++;
          clb(null, { my: 'aggregate', toJSON: function() { return 'aggregateAsJSON'; }, getRevision: function () { return 1; } }, ['stream']);
        };

        cmdHnd.verifyAggregate = function (a, c) {
          expect(a.my).to.eql('aggregate');
          expect(c).to.eql(cmd);
          expect(step).to.eql(5);
          step++;
        };

        cmdHnd.letHandleCommandByAggregate = function (a, c, clb) {
          expect(a.my).to.eql('aggregate');
          expect(c).to.eql(cmd);
          expect(step).to.eql(6);
          step++;
          clb(null, a, 'stream');
        };

        cmdHnd.checkAggregateLock = function (a, clb) {
          expect(a).to.eql('8931');
          expect(step).to.eql(7);
          step++;
          clb(null, { my: 'aggregate', toJSON: function() { return 'aggregateAsJSON'; }, getRevision: function () { return 1; } }, 'stream');
        };

        cmdHnd.commit = function (a, s, clb) {
          expect(a.my).to.eql('aggregate');
          expect(s).to.eql(['stream']);
          expect(step).to.eql(8);
          step++;
          clb(null, [{ evt1: 'one' }, { evt2: 'two' }]);
        };

        cmdHnd.resolveAggregateLock = function (a, clb) {
          expect(a).to.eql('8931');
          expect(step).to.eql(9);
          step++;
          clb(null, [{ evt1: 'one' }, { evt2: 'two' }]);
        };


        cmdHnd.workflow('8931', cmd, function (err, evts, aggData, meta) {
          expect(err).not.to.be.ok();
          expect(step).to.eql(10);
          expect(evts).to.be.an('array');
          expect(evts.length).to.eql(2);
          expect(evts[0].evt1).to.eql('one');
          expect(evts[1].evt2).to.eql('two');
          expect(aggData).to.eql('aggregateAsJSON');
          expect(meta.aggregateId).to.eql('8931');
          expect(meta.aggregate).to.eql('aggName');
          expect(meta.context).to.eql('ctxName');
          done();
        });

      });

    });

    describe('calling handle', function () {

      describe('with a command without aggregate id', function () {

        it('it should work as expected', function (done) {

          var cmd = { my: 'cmd' };
          var queueCalled = false;
          var nextCalled = false;
          var removeCalled = false;
          var workflowCalled = false;
          var aggregateId;

          cmdHnd.defineCommand({
            aggregateId: 'aggId'
          });

          cmdHnd.useEventStore({
            getNewId: function (clb) {
              clb(null, 'newId');
            }
          });

          var queued;

          cmdHnd.queueCommand = function (aggId, c, clb) {
            expect(aggId).to.eql('newId');
            expect(c).to.eql(cmd);
            queueCalled = true;
            queued = { command: c, callback: clb };
          };

          var removed = false;
          cmdHnd.getNextCommandInQueue = function (aggId) {
            expect(aggId).to.eql('newId');
            if (removed) {
              return null;
            }
            nextCalled = true;
            return queued;
          };

          cmdHnd.removeCommandFromQueue = function (aggId, c) {
            expect(aggId).to.eql('newId');
            expect(c).to.eql(cmd);
            removed = true;
            removeCalled = true;
          };

          cmdHnd.workflow = function (aggId, c, clb) {
            expect(c).to.eql(cmd);
            workflowCalled = true;
            clb(null, 'evts', 'aggData', 'meta');
          };

          cmdHnd.handle(cmd, function (err, evts, aggData, meta) {
            expect(err).not.to.be.ok();
            expect(evts).to.eql('evts');
            expect(aggData).to.eql('aggData');
            expect(meta).to.eql('meta');
            expect(cmd.aggId).not.to.be.ok();
            expect(queueCalled).to.eql(true);
            expect(nextCalled).to.eql(true);
            expect(removeCalled).to.eql(true);
            expect(workflowCalled).to.eql(true);
            done();
          });

        });

        describe('having a commandHandler that has defined a getNewAggregateId function', function () {

          it('it should work as expected', function (done) {

            var cmd = { my: 'cmd' };
            var queueCalled = false;
            var nextCalled = false;
            var removeCalled = false;
            var workflowCalled = false;
            var aggregateId;

            cmdHnd.defineCommand({
              aggregateId: 'aggId'
            });

            cmdHnd.useEventStore({
              getNewId: function (clb) {
                clb(null, 'newIdFromStore');
              }
            });

            cmdHnd.aggregateIdGenerator(function (clb) {
              clb(null, 'newIdFromCmdHandler');
            });

            cmdHnd.useAggregate({
              //getNewAggregateId: function (clb) {
              //  clb(null, 'newIdFromAggregate');
              //}
            });

            var queued;

            cmdHnd.queueCommand = function (aggId, c, clb) {
              expect(aggId).to.eql('newIdFromCmdHandler');
              expect(c).to.eql(cmd);
              queueCalled = true;
              queued = { command: c, callback: clb };
            };

            var removed = false;
            cmdHnd.getNextCommandInQueue = function (aggId) {
              expect(aggId).to.eql('newIdFromCmdHandler');
              if (removed) {
                return null;
              }
              nextCalled = true;
              return queued;
            };

            cmdHnd.removeCommandFromQueue = function (aggId, c) {
              expect(aggId).to.eql('newIdFromCmdHandler');
              expect(c).to.eql(cmd);
              removed = true;
              removeCalled = true;
            };

            cmdHnd.workflow = function (aggId, c, clb) {
              expect(c).to.eql(cmd);
              workflowCalled = true;
              clb(null, 'evts', 'aggData', 'meta');
            };

            cmdHnd.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).not.to.be.ok();
              expect(evts).to.eql('evts');
              expect(aggData).to.eql('aggData');
              expect(meta).to.eql('meta');
              expect(cmd.aggId).not.to.be.ok();
              expect(queueCalled).to.eql(true);
              expect(nextCalled).to.eql(true);
              expect(removeCalled).to.eql(true);
              expect(workflowCalled).to.eql(true);
              done();
            });

          });

        });

        describe('having an aggregate that has defined a getNewAggregateId function', function () {

          it('it should work as expected', function (done) {

            var cmd = { my: 'cmd' };
            var queueCalled = false;
            var nextCalled = false;
            var removeCalled = false;
            var workflowCalled = false;
            var aggregateId;

            cmdHnd.defineCommand({
              aggregateId: 'aggId'
            });

            cmdHnd.useEventStore({
              getNewId: function (clb) {
                clb(null, 'newIdFromStore');
              }
            });

            cmdHnd.aggregateIdGenerator(function (clb) {
              clb(null, 'newIdFromCmdHandler');
            });

            cmdHnd.useAggregate({
              getNewAggregateId: function (clb) {
                clb(null, 'newIdFromAggregate');
              }
            });

            var queued;

            cmdHnd.queueCommand = function (aggId, c, clb) {
              expect(aggId).to.eql('newIdFromAggregate');
              expect(c).to.eql(cmd);
              queueCalled = true;
              queued = { command: c, callback: clb };
            };

            var removed = false;
            cmdHnd.getNextCommandInQueue = function (aggId) {
              expect(aggId).to.eql('newIdFromAggregate');
              if (removed) {
                return null;
              }
              nextCalled = true;
              return queued;
            };

            cmdHnd.removeCommandFromQueue = function (aggId, c) {
              expect(aggId).to.eql('newIdFromAggregate');
              expect(c).to.eql(cmd);
              removed = true;
              removeCalled = true;
            };

            cmdHnd.workflow = function (aggId, c, clb) {
              expect(c).to.eql(cmd);
              workflowCalled = true;
              clb(null, 'evts', 'aggData', 'meta');
            };

            cmdHnd.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).not.to.be.ok();
              expect(evts).to.eql('evts');
              expect(aggData).to.eql('aggData');
              expect(meta).to.eql('meta');
              expect(cmd.aggId).not.to.be.ok();
              expect(queueCalled).to.eql(true);
              expect(nextCalled).to.eql(true);
              expect(removeCalled).to.eql(true);
              expect(workflowCalled).to.eql(true);
              done();
            });

          });

        });

        describe('having an aggregate that has defined a getNewAggregateId command aware function', function () {

          it('it should work as expected', function (done) {

            var cmd = { my: 'cmd', id: 'cmdId' };
            var queueCalled = false;
            var nextCalled = false;
            var removeCalled = false;
            var workflowCalled = false;
            var aggregateId;

            cmdHnd.defineCommand({
              aggregateId: 'aggId'
            });

            cmdHnd.useEventStore({
              getNewId: function (clb) {
                clb(null, 'newIdFromStore');
              }
            });

            cmdHnd.aggregateIdGenerator(function (cmd, clb) {
              clb(null, cmd.id + 'newIdFromCmdHandler');
            });

            cmdHnd.useAggregate({
              getNewAggregateId: function (cmd, clb) {
                clb(null, cmd.id + 'newIdFromAggregate');
              }
            });

            var queued;

            cmdHnd.queueCommand = function (aggId, c, clb) {
              expect(aggId).to.eql('cmdIdnewIdFromAggregate');
              expect(c).to.eql(cmd);
              queueCalled = true;
              queued = { command: c, callback: clb };
            };

            var removed = false;
            cmdHnd.getNextCommandInQueue = function (aggId) {
              expect(aggId).to.eql('cmdIdnewIdFromAggregate');
              if (removed) {
                return null;
              }
              nextCalled = true;
              return queued;
            };

            cmdHnd.removeCommandFromQueue = function (aggId, c) {
              expect(aggId).to.eql('cmdIdnewIdFromAggregate');
              expect(c).to.eql(cmd);
              removed = true;
              removeCalled = true;
            };

            cmdHnd.workflow = function (aggId, c, clb) {
              expect(c).to.eql(cmd);
              workflowCalled = true;
              clb(null, 'evts', 'aggData', 'meta');
            };

            cmdHnd.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).not.to.be.ok();
              expect(evts).to.eql('evts');
              expect(aggData).to.eql('aggData');
              expect(meta).to.eql('meta');
              expect(cmd.aggId).not.to.be.ok();
              expect(queueCalled).to.eql(true);
              expect(nextCalled).to.eql(true);
              expect(removeCalled).to.eql(true);
              expect(workflowCalled).to.eql(true);
              done();
            });

          });

        });

      });

      describe('with a command with aggregate id', function () {

        it('it should work as expected', function (done) {

          var cmd = { my: 'cmd', aggId: '1421' };
          var queueCalled = false;
          var nextCalled = false;
          var removeCalled = false;
          var workflowCalled = false;

          cmdHnd.defineCommand({
            aggregateId: 'aggId'
          });

          cmdHnd.useEventStore({
            getNewId: function (clb) {
              clb(null, 'newId');
            }
          });

          var queued;

          cmdHnd.queueCommand = function (aggId, c, clb) {
            expect(aggId).to.eql('1421');
            expect(c).to.eql(cmd);
            queueCalled = true;
            queued = { command: c, callback: clb };
          };

          var removed = false;
          cmdHnd.getNextCommandInQueue = function (aggId) {
            expect(aggId).to.eql('1421');
            if (removed) {
              return null;
            }
            nextCalled = true;
            return queued;
          };

          cmdHnd.removeCommandFromQueue = function (aggId, c) {
            expect(aggId).to.eql('1421');
            expect(c).to.eql(cmd);
            removed = true;
            removeCalled = true;
          };

          cmdHnd.workflow = function (aggId, c, clb) {
            expect(aggId).to.eql('1421');
            expect(c).to.eql(cmd);
            workflowCalled = true;
            clb(null, 'evts', 'aggData', 'meta');
          };

          cmdHnd.handle(cmd, function (err, evts, aggData, meta) {
            expect(err).not.to.be.ok();
            expect(evts).to.eql('evts');
            expect(aggData).to.eql('aggData');
            expect(meta).to.eql('meta');
            expect(cmd.aggId).to.eql('1421');
            expect(queueCalled).to.eql(true);
            expect(nextCalled).to.eql(true);
            expect(removeCalled).to.eql(true);
            expect(workflowCalled).to.eql(true);
            done();
          });

        });

      });

      describe('with a command with aggregate id, an aggregate and a context', function () {

        it('it should work as expected', function (done) {

          var cmd = { my: 'cmd', aggId: '1421', aggr: 'a', ctx: 'c' };
          var queueCalled = false;
          var nextCalled = false;
          var removeCalled = false;
          var workflowCalled = false;

          cmdHnd.defineCommand({
            aggregateId: 'aggId',
            aggregate: 'aggr',
            context: 'ctx'
          });

          cmdHnd.useEventStore({
            getNewId: function (clb) {
              clb(null, 'newId');
            }
          });

          var queued;

          cmdHnd.queueCommand = function (aggId, c, clb) {
            expect(aggId).to.eql('ca1421');
            expect(c).to.eql(cmd);
            queueCalled = true;
            queued = { command: c, callback: clb };
          };

          var removed = false;
          cmdHnd.getNextCommandInQueue = function (aggId) {
            expect(aggId).to.eql('ca1421');
            if (removed) {
              return null;
            }
            nextCalled = true;
            return queued;
          };

          cmdHnd.removeCommandFromQueue = function (aggId, c) {
            expect(aggId).to.eql('ca1421');
            expect(c).to.eql(cmd);
            removed = true;
            removeCalled = true;
          };

          cmdHnd.workflow = function (aggId, c, clb) {
            expect(aggId).to.eql('1421');
            expect(c).to.eql(cmd);
            workflowCalled = true;
            clb(null, 'evts', 'aggData', 'meta');
          };

          cmdHnd.handle(cmd, function (err, evts, aggData, meta) {
            expect(err).not.to.be.ok();
            expect(evts).to.eql('evts');
            expect(aggData).to.eql('aggData');
            expect(meta).to.eql('meta');
            expect(cmd.aggId).to.eql('1421');
            expect(queueCalled).to.eql(true);
            expect(nextCalled).to.eql(true);
            expect(removeCalled).to.eql(true);
            expect(workflowCalled).to.eql(true);
            done();
          });

        });

      });

    });

  });

});
