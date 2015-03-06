var expect = require('expect.js'),
  api = require('../../index'),
  ValidationError = require('../../lib/errors/validationError'),
  BusinessRuleError = require('../../lib/errors/businessRuleError'),
  AggregateDestroyedError = require('../../lib/errors/aggregateDestroyedError'),
  AggregateConcurrencyError = require('../../lib/errors/aggregateConcurrencyError'),
  ConcurrencyError = require('../../lib/errors/concurrencyError'),
  _ = require('lodash');

describe('domain', function () {

  it('it should be a function', function () {

    expect(api).to.be.a('function');

  });

  it('it should expose all domain errors', function () {

    expect(api.errors.ValidationError).to.eql(ValidationError);
    expect(api.errors.BusinessRuleError).to.eql(BusinessRuleError);
    expect(api.errors.AggregateDestroyedError).to.eql(AggregateDestroyedError);
    expect(api.errors.AggregateConcurrencyError).to.eql(AggregateConcurrencyError);
    expect(api.errors.ConcurrencyError).to.eql(ConcurrencyError);

  });

  it('it should have the correct api', function () {

    expect(api.defineContext).to.be.a('function');
    expect(api.defineAggregate).to.be.a('function');
    expect(api.defineCommand).to.be.a('function');
    expect(api.defineEvent).to.be.a('function');
    expect(api.defineBusinessRule).to.be.a('function');
    expect(api.definePreCondition).to.be.a('function');
    expect(api.defineCommandHandler).to.be.a('function');

  });

  describe('calling that function', function () {

    describe('without options', function () {

      it('it should throw an error', function () {

        expect(api).to.throwError('/domainPath/');

      });

    });

    describe('with all mandatory options', function () {

      it('it should return as expected', function () {

        var domain = api({ domainPath: __dirname });
        expect(domain).to.be.a('object');
        expect(domain.on).to.be.a('function');
        expect(domain.eventStore).to.be.an('object');
        expect(domain.eventStore.on).to.be.a('function');
        expect(domain.aggregateLock).to.be.an('object');
        expect(domain.aggregateLock.on).to.be.a('function');
        expect(domain.defineCommand).to.be.a('function');
        expect(domain.defineEvent).to.be.a('function');
        expect(domain.idGenerator).to.be.a('function');
        expect(domain.onEvent).to.be.a('function');
        expect(domain.init).to.be.a('function');
        expect(domain.handle).to.be.a('function');

        expect(domain.options.retryOnConcurrencyTimeout).to.eql(800);
        expect(domain.options.commandRejectedEventName).to.eql('commandRejected');
        expect(domain.options.snapshotThreshold).to.eql(100);

      });

    });

    describe('with "eventStore" factory method', function () {

      describe('creating an object of the wrong interface', function () {

        it('it should throw an error', function () {

          expect(function () {
            api({
              domainPath: __dirname,
              eventStore: function () {
                return {
                  init: function (callback) { },
                  getNewId: function (callback) { },
                  on: 4,  // not a function
                  createSnapshot: function (obj, callback) { },
                  getFromSnapshot: function (query, revMax, callback) { },
                  setEventToDispatched: function (evt, callback) { }
                }
              }
            })
          }).to.throwError('/eventStore/');

        });
      });

      describe('creating an object of the right interface', function () {

        it('it should return as expected', function () {

          var domain = api({
            domainPath: __dirname,
            eventStore: function () {
              return {
                init: function (callback) {

                },
                getNewId: function (callback) {

                },
                on: function (evtName, callback) {

                },
                createSnapshot: function (obj, callback) {

                },
                getFromSnapshot: function (query, revMax, callback) {

                },
                setEventToDispatched: function (evt, callback) {

                }
              }
            }});
          expect(domain).to.be.a('object');
          expect(domain.on).to.be.a('function');
          expect(domain.eventStore).to.be.an('object');
          expect(domain.eventStore.on).to.be.a('function');
          expect(domain.aggregateLock).to.be.an('object');
          expect(domain.aggregateLock.on).to.be.a('function');
          expect(domain.defineCommand).to.be.a('function');
          expect(domain.defineEvent).to.be.a('function');
          expect(domain.idGenerator).to.be.a('function');
          expect(domain.onEvent).to.be.a('function');
          expect(domain.init).to.be.a('function');
          expect(domain.handle).to.be.a('function');

          expect(domain.options.retryOnConcurrencyTimeout).to.eql(800);
          expect(domain.options.commandRejectedEventName).to.eql('commandRejected');
          expect(domain.options.snapshotThreshold).to.eql(100);

        });
      });

    });

    describe('with "aggregateLock" factory method', function () {

      describe('creating an object of the wrong interface', function () {

        it('it should throw an error', function () {

          expect(function () {
            api({
              domainPath: __dirname,
              aggregateLock: function () {
                return {
                  connect: function (callback) { },
                  disconnect: function (callback) { },
                  getNewId: function (callback) { },
                  reserve: 4,  // not a function
                  getAll: function (aggregateId, callback) { },
                  resolve: function (aggregateId, callback) { }
                }
              }
            })
          }).to.throwError('/aggregateLock/');

        });

      });

      describe('creating an object of the right interface', function () {

        it('it should return as expected', function () {

          var domain = api({
            domainPath: __dirname,
            aggregateLock: function () {
              return {
                connect: function (callback) { },
                disconnect: function (callback) { },
                getNewId: function (callback) { },
                reserve: function (workerId, aggregateId, callback) { },
                getAll: function (aggregateId, callback) { },
                resolve: function (aggregateId, callback) { },
                on: function (evtName, callback) { }
              }
            }
          });

          expect(domain).to.be.a('object');
          expect(domain.on).to.be.a('function');
          expect(domain.eventStore).to.be.an('object');
          expect(domain.eventStore.on).to.be.a('function');
          expect(domain.aggregateLock).to.be.an('object');
          expect(domain.aggregateLock.on).to.be.a('function');
          expect(domain.defineCommand).to.be.a('function');
          expect(domain.defineEvent).to.be.a('function');
          expect(domain.idGenerator).to.be.a('function');
          expect(domain.onEvent).to.be.a('function');
          expect(domain.init).to.be.a('function');
          expect(domain.handle).to.be.a('function');

          expect(domain.options.retryOnConcurrencyTimeout).to.eql(800);
          expect(domain.options.commandRejectedEventName).to.eql('commandRejected');
          expect(domain.options.snapshotThreshold).to.eql(100);
        });

      });

    });

    describe('defining an id generator function', function() {

      var domain;

      beforeEach(function () {
        domain = api({ domainPath: __dirname });
        domain.getNewId = null;
      });

      describe('in a synchronous way', function() {

        it('it should be transformed internally to an asynchronous way', function(done) {

          domain.idGenerator(function () {
            var id = require('node-uuid').v4().toString();
            return id;
          });

          domain.getNewId(function (err, id) {
            expect(id).to.be.a('string');
            done();
          });

        });

      });

      describe('in an synchronous way', function() {

        it('it should be taken as it is', function(done) {

          domain.idGenerator(function (callback) {
            setTimeout(function () {
              var id = require('node-uuid').v4().toString();
              callback(null, id);
            }, 10);
          });

          domain.getNewId(function (err, id) {
            expect(id).to.be.a('string');
            done();
          });

        });

      });

    });

    describe('defining the command structure', function() {

      var domain;

      beforeEach(function () {
        domain = api({ domainPath: __dirname });
      });

      describe('using the defaults', function () {

        it('it should apply the defaults', function() {

          var defaults = _.cloneDeep(domain.definitions.command);

          domain.defineCommand({
            payload: 'data',
            aggregate: 'aggName',
            context: 'ctx.Name',
            revision: 'rev',
            version: 'v.',
            meta: 'pass'
          });

          expect(defaults.id).to.eql(domain.definitions.command.id);
          expect(domain.definitions.command.payload).to.eql('data');
          expect(defaults.payload).not.to.eql(domain.definitions.command.payload);
          expect(defaults.name).to.eql(domain.definitions.command.name);
          expect(defaults.aggregateId).to.eql(domain.definitions.command.aggregateId);
          expect(domain.definitions.command.aggregate).to.eql('aggName');
          expect(defaults.aggregate).not.to.eql(domain.definitions.command.aggregate);
          expect(domain.definitions.command.context).to.eql('ctx.Name');
          expect(defaults.context).not.to.eql(domain.definitions.command.context);
          expect(domain.definitions.command.revision).to.eql('rev');
          expect(defaults.revision).not.to.eql(domain.definitions.command.revision);
          expect(domain.definitions.command.version).to.eql('v.');
          expect(defaults.version).not.to.eql(domain.definitions.command.version);
          expect(domain.definitions.command.meta).to.eql('pass');
          expect(defaults.meta).not.to.eql(domain.definitions.command.meta);

        });

      });

      describe('overwriting the defaults', function () {

        it('it should apply them correctly', function() {

          var defaults = _.cloneDeep(domain.definitions.command);

          domain.defineCommand({
            id: 'commandId',
            payload: 'data',
            name: 'cmdName',
            aggregateId: 'path.to.aggId',
            aggregate: 'aggName',
            context: 'ctx.Name',
            revision: 'rev',
            version: 'v.',
            meta: 'pass'
          });

          expect(domain.definitions.command.id).to.eql('commandId');
          expect(defaults.id).not.to.eql(domain.definitions.command.id);
          expect(domain.definitions.command.payload).to.eql('data');
          expect(defaults.payload).not.to.eql(domain.definitions.command.payload);
          expect(domain.definitions.command.name).to.eql('cmdName');
          expect(defaults.name).not.to.eql(domain.definitions.command.name);
          expect(domain.definitions.command.aggregateId).to.eql('path.to.aggId');
          expect(defaults.aggregateId).not.to.eql(domain.definitions.command.aggregateId);
          expect(domain.definitions.command.aggregate).to.eql('aggName');
          expect(defaults.aggregate).not.to.eql(domain.definitions.command.aggregate);
          expect(domain.definitions.command.context).to.eql('ctx.Name');
          expect(defaults.context).not.to.eql(domain.definitions.command.context);
          expect(domain.definitions.command.revision).to.eql('rev');
          expect(defaults.revision).not.to.eql(domain.definitions.command.revision);
          expect(domain.definitions.command.version).to.eql('v.');
          expect(defaults.version).not.to.eql(domain.definitions.command.version);
          expect(domain.definitions.command.meta).to.eql('pass');
          expect(defaults.meta).not.to.eql(domain.definitions.command.meta);

        });

      });

    });

    describe('defining the event structure', function() {

      var domain;

      beforeEach(function () {
        domain = api({ domainPath: __dirname });
      });

      describe('using the defaults', function () {

        it('it should apply the defaults', function() {

          var defaults = _.cloneDeep(domain.definitions.event);

          domain.defineEvent({
            payload: 'data',
            aggregate: 'aggName',
            context: 'ctx.Name',
            revision: 'rev',
            version: 'v.',
            meta: 'pass'
          });

          expect(defaults.correlationId).to.eql(domain.definitions.event.correlationId);
          expect(defaults.id).to.eql(domain.definitions.event.id);
          expect(domain.definitions.event.payload).to.eql('data');
          expect(defaults.payload).not.to.eql(domain.definitions.event.payload);
          expect(defaults.name).to.eql(domain.definitions.event.name);
          expect(defaults.aggregateId).to.eql(domain.definitions.event.aggregateId);
          expect(domain.definitions.event.aggregate).to.eql('aggName');
          expect(defaults.aggregate).not.to.eql(domain.definitions.event.aggregate);
          expect(domain.definitions.event.context).to.eql('ctx.Name');
          expect(defaults.context).not.to.eql(domain.definitions.event.context);
          expect(domain.definitions.event.revision).to.eql('rev');
          expect(defaults.revision).not.to.eql(domain.definitions.event.revision);
          expect(domain.definitions.event.version).to.eql('v.');
          expect(defaults.version).not.to.eql(domain.definitions.event.version);
          expect(domain.definitions.event.meta).to.eql('pass');
          expect(defaults.meta).not.to.eql(domain.definitions.event.meta);

        });

      });

      describe('overwriting the defaults', function () {

        it('it should apply them correctly', function() {

          var defaults = _.cloneDeep(domain.definitions.event);

          domain.defineEvent({
            correlationId: 'cmdId',
            id: 'eventId',
            payload: 'data',
            name: 'defName',
            aggregateId: 'path.to.aggId',
            aggregate: 'aggName',
            context: 'ctx.Name',
            revision: 'rev',
            version: 'v.',
            meta: 'pass'
          });


          expect(domain.definitions.event.correlationId).to.eql('cmdId');
          expect(defaults.correlationId).not.to.eql(domain.definitions.event.correlationId);
          expect(domain.definitions.event.id).to.eql('eventId');
          expect(defaults.id).not.to.eql(domain.definitions.event.id);
          expect(domain.definitions.event.payload).to.eql('data');
          expect(defaults.payload).not.to.eql(domain.definitions.event.payload);
          expect(domain.definitions.event.name).to.eql('defName');
          expect(defaults.name).not.to.eql(domain.definitions.event.name);
          expect(domain.definitions.event.aggregateId).to.eql('path.to.aggId');
          expect(defaults.aggregateId).not.to.eql(domain.definitions.event.aggregateId);
          expect(domain.definitions.event.aggregate).to.eql('aggName');
          expect(defaults.aggregate).not.to.eql(domain.definitions.event.aggregate);
          expect(domain.definitions.event.context).to.eql('ctx.Name');
          expect(defaults.context).not.to.eql(domain.definitions.event.context);
          expect(domain.definitions.event.revision).to.eql('rev');
          expect(defaults.revision).not.to.eql(domain.definitions.event.revision);
          expect(domain.definitions.event.version).to.eql('v.');
          expect(defaults.version).not.to.eql(domain.definitions.event.version);
          expect(domain.definitions.event.meta).to.eql('pass');
          expect(defaults.meta).not.to.eql(domain.definitions.event.meta);

        });

      });

    });

    describe('defining onEvent handler', function () {

      var domain;

      beforeEach(function () {
        domain = api({ domainPath: __dirname });
        domain.onEventHandle = null;
      });

      describe('in a synchronous way', function() {

        it('it should be transformed internally to an asynchronous way', function(done) {

          var called = false;
          domain.onEvent(function (evt) {
            expect(evt.my).to.eql('evt');
            called = true;
          });

          domain.onEventHandle({ my: 'evt' }, function (err) {
            expect(err).not.to.be.ok();
            expect(called).to.eql(true);
            done();
          });

        });

      });

      describe('in an synchronous way', function() {

        it('it should be taken as it is', function(done) {

          var called = false;
          domain.onEvent(function (evt, callback) {
            setTimeout(function () {
              expect(evt.my).to.eql('evt');
              called = true;
              callback(null);
            }, 10);
          });

          domain.onEventHandle({ my: 'evt' }, function (err) {
            expect(err).not.to.be.ok();
            expect(called).to.eql(true);
            done();
          });

        });

      });

    });

    describe('calling createCommandRejectedEvent', function () {

      var domain;

      beforeEach(function () {
        domain = api({ domainPath: __dirname, commandRejectedEventName: 'cmdRej' });
        domain.defineCommand({
          id: 'i',
          name: 'n',
          aggregateId: 'ai',
          context: 'c',
          aggregate: 'a',
          payload: 'p',
          revision: 'r',
          version: 'v',
          meta: 'm'
        });
        domain.defineEvent({
          correlationId: 'corr',
          id: 'i',
          name: 'n',
          aggregateId: 'ai',
          context: 'c',
          aggregate: 'a',
          payload: 'p',
          revision: 'r',
          version: 'v',
          meta: 'm'
        });
      });

//      describe('with an error as object', function () {
//
//        it('it should return an event as expected', function () {
//
//          var cmd = { i: 'cmdId', n: 'cmdName', ai: 'aggregateId', c: 'context', p: 'payload', r: 'revision', v: 'version', m: 'meta' };
//          var err = { my: 'err' };
//
//          var evt = domain.createCommandRejectedEvent(cmd, err);
//
//          expect(evt.corr).to.eql(cmd.i);
//          expect(evt.i).to.eql(cmd.i + '_rejected');
//          expect(evt.n).to.eql('cmdRej');
//          expect(evt.ai).to.eql(cmd.ai);
//          expect(evt.c).to.eql(cmd.c);
//          expect(evt.a).to.eql(cmd.a);
//          expect(evt.r).not.to.be.ok();
//          expect(evt.v).not.to.be.ok();
//          expect(evt.m).to.eql(cmd.m);
//          expect(evt.p.command).to.eql(cmd);
//          expect(evt.p.reason).to.eql(err);
//
//        });
//
//      });
//
//      describe('with an error as Error', function () {
//
//        it('it should return an event as expected', function () {
//
//          var cmd = { i: 'cmdId', n: 'cmdName', ai: 'aggregateId', c: 'context', p: 'payload', r: 'revision', v: 'version', m: 'meta' };
//          var err = new Error('my err');
//
//          var evt = domain.createCommandRejectedEvent(cmd, err);
//
//          expect(evt.corr).to.eql(cmd.i);
//          expect(evt.i).to.eql(cmd.i + '_rejected');
//          expect(evt.n).to.eql('cmdRej');
//          expect(evt.ai).to.eql(cmd.ai);
//          expect(evt.c).to.eql(cmd.c);
//          expect(evt.a).to.eql(cmd.a);
//          expect(evt.r).not.to.be.ok();
//          expect(evt.v).not.to.be.ok();
//          expect(evt.m).to.eql(cmd.m);
//          expect(evt.p.command).to.eql(cmd);
//          expect(evt.p.reason.name).to.eql('Error');
//          expect(evt.p.reason.message).to.eql('my err');
//
//        });
//
//      });

      describe('with an error as ValidationError', function () {

        it('it should return an event as expected', function () {

          var cmd = { i: 'cmdId', n: 'cmdName', ai: 'aggregateId', c: 'context', p: 'payload', r: 'revision', v: 'version', m: 'meta' };
          var err = new ValidationError('my err', { mo: 're' });

          var evt = domain.createCommandRejectedEvent(cmd, err);

          expect(evt.corr).to.eql(cmd.i);
          expect(evt.i).to.eql(cmd.i + '_rejected');
          expect(evt.n).to.eql('cmdRej');
          expect(evt.ai).to.eql(cmd.ai);
          expect(evt.c).to.eql(cmd.c);
          expect(evt.a).to.eql(cmd.a);
          expect(evt.r).not.to.be.ok();
          expect(evt.v).not.to.be.ok();
          expect(evt.m).to.eql(cmd.m);
          expect(evt.p.command).to.eql(cmd);
          expect(evt.p.reason.name).to.eql('ValidationError');
          expect(evt.p.reason.message).to.eql('my err');
          expect(evt.p.reason.more.mo).to.eql('re');

        });

      });

      describe('with an error as BusinessRuleError', function () {

        it('it should return an event as expected', function () {

          var cmd = { i: 'cmdId', n: 'cmdName', ai: 'aggregateId', c: 'context', p: 'payload', r: 'revision', v: 'version', m: 'meta' };
          var err = new BusinessRuleError('my err');

          var evt = domain.createCommandRejectedEvent(cmd, err);

          expect(evt.corr).to.eql(cmd.i);
          expect(evt.i).to.eql(cmd.i + '_rejected');
          expect(evt.n).to.eql('cmdRej');
          expect(evt.ai).to.eql(cmd.ai);
          expect(evt.c).to.eql(cmd.c);
          expect(evt.a).to.eql(cmd.a);
          expect(evt.r).not.to.be.ok();
          expect(evt.v).not.to.be.ok();
          expect(evt.m).to.eql(cmd.m);
          expect(evt.p.command).to.eql(cmd);
          expect(evt.p.reason.name).to.eql('BusinessRuleError');
          expect(evt.p.reason.message).to.eql('my err');

        });

      });

      describe('with an error as AggregateDestroyedError', function () {

        it('it should return an event as expected', function () {

          var cmd = { i: 'cmdId', n: 'cmdName', ai: 'aggregateId', c: 'context', p: 'payload', r: 'revision', v: 'version', m: 'meta' };
          var err = new AggregateDestroyedError('my err', { mo: 're' });

          var evt = domain.createCommandRejectedEvent(cmd, err);

          expect(evt.corr).to.eql(cmd.i);
          expect(evt.i).to.eql(cmd.i + '_rejected');
          expect(evt.n).to.eql('cmdRej');
          expect(evt.ai).to.eql(cmd.ai);
          expect(evt.c).to.eql(cmd.c);
          expect(evt.a).to.eql(cmd.a);
          expect(evt.r).not.to.be.ok();
          expect(evt.v).not.to.be.ok();
          expect(evt.m).to.eql(cmd.m);
          expect(evt.p.command).to.eql(cmd);
          expect(evt.p.reason.name).to.eql('AggregateDestroyedError');
          expect(evt.p.reason.message).to.eql('my err');
          expect(evt.p.reason.more.mo).to.eql('re');

        });

      });

      describe('with an error as AggregateConcurrencyError', function () {

        it('it should return an event as expected', function () {

          var cmd = { i: 'cmdId', n: 'cmdName', ai: 'aggregateId', c: 'context', p: 'payload', r: 'revision', v: 'version', m: 'meta' };
          var err = new AggregateConcurrencyError('my err', { mo: 're' });

          var evt = domain.createCommandRejectedEvent(cmd, err);

          expect(evt.corr).to.eql(cmd.i);
          expect(evt.i).to.eql(cmd.i + '_rejected');
          expect(evt.n).to.eql('cmdRej');
          expect(evt.ai).to.eql(cmd.ai);
          expect(evt.c).to.eql(cmd.c);
          expect(evt.a).to.eql(cmd.a);
          expect(evt.r).not.to.be.ok();
          expect(evt.v).not.to.be.ok();
          expect(evt.m).to.eql(cmd.m);
          expect(evt.p.command).to.eql(cmd);
          expect(evt.p.reason.name).to.eql('AggregateConcurrencyError');
          expect(evt.p.reason.message).to.eql('my err');
          expect(evt.p.reason.more.mo).to.eql('re');

        });

      });

    });

    describe('initializing', function () {

      var domain;

      beforeEach(function () {
        domain = api({ domainPath: __dirname });
        domain.defineCommand({
          id: 'i',
          name: 'n',
          aggregateId: 'ai',
          context: 'c',
          aggregate: 'a',
          payload: 'p',
          revision: 'r',
          version: 'v',
          meta: 'm'
        });
        domain.defineEvent({
          correlationId: 'corr',
          id: 'i',
          name: 'n',
          aggregateId: 'ai',
          context: 'c',
          aggregate: 'a',
          payload: 'p',
          revision: 'r',
          version: 'v',
          meta: 'm'
        });
      });

      describe('with a callback', function () {

        it('it should work as expected', function (done) {

          var called = 0;
          domain.eventStore.once('connect', function () {
            called++;
          });
          domain.aggregateLock.once('connect', function () {
            called++;
          });
          domain.once('connect', function () {
            called++;
          });

          domain.init(function (err) {
            expect(err).not.to.be.ok();
            expect(called).to.eql(3);
            done();
          });

        });

      });

      describe('without a callback', function () {

        it('it should work as expected', function (done) {

          var called = 0;

          function check () {
            called++;
            if (called >= 3) {
              done();
            }
          }

          domain.eventStore.once('connect', function () {
            check();
          });
          domain.aggregateLock.once('connect', function () {
            check();
          });
          domain.once('connect', function () {
            check();
          });

          domain.init();

        });

      });

    });

    describe('handling a command', function () {

      var domain;

      beforeEach(function () {
        domain = api({ domainPath: __dirname });
        domain.defineCommand({
          id: 'i',
          name: 'n',
          aggregateId: 'ai',
          context: 'c',
          aggregate: 'a',
          payload: 'p',
          revision: 'r',
          version: 'v',
          meta: 'm'
        });
        domain.defineEvent({
          correlationId: 'corr',
          id: 'i',
          name: 'n',
          aggregateId: 'ai',
          context: 'c',
          aggregate: 'a',
          payload: 'p',
          revision: 'r',
          version: 'v',
          meta: 'm'
        });
      });

      describe('with a callback', function () {

        it('it should work as expected', function (done) {

          var cmd = { i: 'cmdId', n: 'cmdName', ai: 'aggregateId', c: 'context', p: 'payload', r: 'revision', v: 'version', m: 'meta' };
          var dispatchCalled = false;
          var eventstoreCalled = [];
          var onEventCalled = [];

          domain.onEvent(function (e) {
            onEventCalled.push(e);
          });

          domain.init(function (err) {
            expect(err).not.to.be.ok();

            domain.commandDispatcher.dispatch = function (c, clb) {
              dispatchCalled = true;
              clb(null, [{ id: '1', my1: 'evt1', payload: '1' }, { id: '2', my2: 'evt2', payload: '2' }], 'aggData', 'meta');
            };

            domain.eventStore.setEventToDispatched = function (e, clb) {
              eventstoreCalled.push(e);
              clb(null);
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).not.to.be.ok();
              expect(dispatchCalled).to.eql(true);
              expect(aggData).to.eql('aggData');
              expect(meta).to.eql('meta');
              expect(eventstoreCalled.length).to.eql(2);
              expect(eventstoreCalled[0].my1).to.eql('evt1');
              expect(eventstoreCalled[1].my2).to.eql('evt2');
              expect(onEventCalled.length).to.eql(2);
              expect(onEventCalled[0]).to.eql('1');
              expect(onEventCalled[1]).to.eql('2');
              expect(evts.length).to.eql(2);
              expect(evts[0]).to.eql('1');
              expect(evts[1]).to.eql('2');

              done();
            });
          });

        });

      });

      describe('without a callback', function () {

        it('it should work as expected', function (done) {

          var cmd = { i: 'cmdId', n: 'cmdName', ai: 'aggregateId', c: 'context', p: 'payload', r: 'revision', v: 'version', m: 'meta' };
          var dispatchCalled = false;
          var eventstoreCalled = [];
          var onEventCalled = [];

          domain.onEvent(function (e) {
            onEventCalled.push(e);
          });

          domain.init(function (err) {
            expect(err).not.to.be.ok();

            domain.commandDispatcher.dispatch = function (c, clb) {
              dispatchCalled = true;
              clb(null, [{ id: '1', my1: 'evt1', payload: '1' }, { id: '2', my2: 'evt2', payload: '2' }], 'aggData', 'meta');
            };

            domain.eventStore.setEventToDispatched = function (e, clb) {
              eventstoreCalled.push(e);
              clb(null);

              if (eventstoreCalled.length === 2) {
                expect(dispatchCalled).to.eql(true);
                expect(eventstoreCalled.length).to.eql(2);
                expect(eventstoreCalled[0].my1).to.eql('evt1');
                expect(eventstoreCalled[1].my2).to.eql('evt2');
                expect(onEventCalled.length).to.eql(2);
                expect(onEventCalled[0]).to.eql('1');
                expect(onEventCalled[1]).to.eql('2');

                done();
              }
            };

            domain.handle(cmd);
          });

        });

      });

    });

  });

});