var expect = require('expect.js'),
  api = require('../'),
  _ = require('lodash');

describe('domain', function () {

  it('it should be a function', function () {

    expect(api).to.be.a('function');

  });

  it('it should have the correct api', function () {

    expect(api.defineContext).to.be.a('function');
    expect(api.defineAggregate).to.be.a('function');
    expect(api.defineCommand).to.be.a('function');
    expect(api.defineEvent).to.be.a('function');
    expect(api.defineBusinessRule).to.be.a('function');
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

  });

});