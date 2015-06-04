var expect = require('expect.js'),
  assert = require('assert'),
  api = require('../../index'),
  async = require('async'),
  _ = require('lodash'),
  uuid = require('node-uuid').v4;

describe.only('migration of domain', function () {

  var oldEventStore;

  var personsAggregateId = uuid().toString();

  var v1Events = [];

  var v1Commands = [
    {
      id: uuid().toString(),
      name: 'enterNewPerson',
      aggregate: {
        id: personsAggregateId,
        name: 'persons'
      },
      context: {
        name: 'hr'
      },
      payload: {
        firstname: 'jack',
        lastname: 'doe',
        email: 'jack@doe.com'
      },
      revision: 0,
      version: 0,
      meta: {
        userId: 'userId'
      }
    },
    {
      id: uuid().toString(),
      name: 'enterNewPerson',
      aggregate: {
        id: personsAggregateId,
        name: 'persons'
      },
      context: {
        name: 'hr'
      },
      payload: {
        firstname: 'fitz',
        lastname: 'gerald',
        email: 'fitz@gerald.com'
      },
      revision: 1,
      version: 0,
      meta: {
        userId: 'userId'
      }
    },
    {
      id: uuid().toString(),
      name: 'enterNewPerson',
      aggregate: {
        id: personsAggregateId,
        name: 'persons'
      },
      context: {
        name: 'hr'
      },
      payload: {
        firstname: 'pablo',
        lastname: 'picasso',
        email: 'pablo@picasso.com'
      },
      revision: 2,
      version: 0,
      meta: {
        userId: 'userId'
      }
    },
    {
      id: uuid().toString(),
      name: 'enterNewPerson',
      aggregate: {
        id: personsAggregateId,
        name: 'persons'
      },
      context: {
        name: 'hr'
      },
      payload: {
        firstname: 'steve',
        lastname: 'jobs',
        email: 'steve@jobs.com'
      },
      revision: 3,
      version: 0,
      meta: {
        userId: 'userId'
      }
    },
    {
      id: uuid().toString(),
      name: 'enterNewPerson',
      aggregate: {
        id: personsAggregateId,
        name: 'persons'
      },
      context: {
        name: 'hr'
      },
      payload: {
        firstname: 'mister',
        lastname: 't',
        email: 'fitz@gerald.com'
      },
      revision: 4,
      version: 0,
      meta: {
        userId: 'userId',
        shouldFail: true
      }
    },
    {
      id: uuid().toString(),
      name: 'enterNewPerson',
      aggregate: {
        id: personsAggregateId,
        name: 'persons'
      },
      context: {
        name: 'hr'
      },
      payload: {
        firstname: 'mister',
        lastname: 't',
        email: 'mister@t.com'
      },
      revision: 4,
      version: 0,
      meta: {
        userId: 'userId'
      }
    }
  ];

  var v1CommandsForV2 = [
    {
      id: uuid().toString(),
      name: 'enterNewPerson',
      aggregate: {
        id: personsAggregateId,
        name: 'persons'
      },
      context: {
        name: 'hr'
      },
      payload: {
        firstname: 'already',
        lastname: 'in old stream',
        email: 'mister@t.com'
      },
      revision: 5,
      version: 0,
      meta: {
        userId: 'userId',
        shouldFail: true
      }
    },
    {
      id: uuid().toString(),
      name: 'enterNewPerson',
      aggregate: {
        id: personsAggregateId,
        name: 'persons'
      },
      context: {
        name: 'hr'
      },
      payload: {
        firstname: 'new',
        lastname: 'for old version',
        email: 'newForOld@version.com'
      },
      revision: 6,
      version: 0,
      meta: {
        userId: 'userId'
      }
    }
  ];

  describe('v1', function () {

    var domain;

    before(function (done) {
      domain = api({ domainPath: __dirname + '/fixture/migration/v1' });
      domain.defineCommand({
        id: 'id',
        name: 'name',
        aggregateId: 'aggregate.id',
        context: 'context.name',
        aggregate: 'aggregate.name',
        payload: 'payload',
        revision: 'revision',
        version: 'version',
        meta: 'meta'
      });
      domain.defineEvent({
        correlationId: 'correlationId',
        id: 'id',
        name: 'name',
        aggregateId: 'aggregate.id',
        context: 'context.name',
        aggregate: 'aggregate.name',
        payload: 'payload',
        revision: 'revision',
        version: 'version',
        meta: 'meta'
      });

      domain.init(function (err) {
        oldEventStore = domain.eventStore;
        done(err);
      });
    });

    describe('handling a set of commands', function () {

      it('it should work as expected', function (done) {

        async.eachSeries(v1Commands, function (cmd, callback) {
          domain.handle(cmd, function (err, evts, aggData, meta) {

            if (cmd.meta.shouldFail) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('BusinessRuleError');
              expect(err.message).to.eql('email already used');

              return callback();
            }

            expect(err).not.to.be.ok();
            expect(evts.length).to.eql(1);
            expect(evts[0].name).to.eql('enteredNewPerson');
            expect(evts[0].payload).to.eql(cmd.payload);
            expect(evts[0].meta).to.eql(cmd.meta);
            expect(evts[0].revision).to.eql(cmd.revision + 1);

            expect(meta.aggregateId).to.eql(cmd.aggregate.id);
            expect(meta.aggregate).to.eql(cmd.aggregate.name);
            expect(meta.context).to.eql(cmd.context.name);

            v1Events.push(evts[0]);

            callback();
          });
        }, done);

      });

    });

  });

  describe('v2', function () {

    describe('handling the same set of commands as v1', function () {

      var domain;

      before(function (done) {
        domain = api({ domainPath: __dirname + '/fixture/migration/v2' });
        domain.defineCommand({
          id: 'id',
          name: 'name',
          aggregateId: 'aggregate.id',
          context: 'context.name',
          aggregate: 'aggregate.name',
          payload: 'payload',
          revision: 'revision',
          version: 'version',
          meta: 'meta'
        });
        domain.defineEvent({
          correlationId: 'correlationId',
          id: 'id',
          name: 'name',
          aggregateId: 'aggregate.id',
          context: 'context.name',
          aggregate: 'aggregate.name',
          payload: 'payload',
          revision: 'revision',
          version: 'version',
          meta: 'meta'
        });

        domain.init(done);
      });

      it('it should work as expected', function (done) {

        var i = 0;

        async.eachSeries(v1Commands, function (cmd, callback) {
          domain.handle(cmd, function (err, evts, aggData, meta) {

            if (cmd.meta.shouldFail) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('BusinessRuleError');
              expect(err.message).to.eql('email already used');

              return callback();
            }

            expect(err).not.to.be.ok();
            expect(evts.length).to.eql(1);
            expect(evts[0].name).to.eql('enteredNewPerson');
            expect(evts[0].payload).to.eql(cmd.payload);
            expect(evts[0].meta).to.eql(cmd.meta);
            expect(evts[0].revision).to.eql(cmd.revision + 1);

            expect(meta.aggregateId).to.eql(cmd.aggregate.id);
            expect(meta.aggregate).to.eql('mails');
            expect(meta.context).to.eql('hr');

            assert.deepEqual(_.omit(evts[0], 'id'), _.omit(v1Events[i], 'id'));

            i++;
            callback();
          });
        }, done);

      });

    });

    describe('having an existing eventstore created at v1', function () {

      var domain;

      before(function (done) {
        domain = api({ domainPath: __dirname + '/fixture/migration/v2' });
        domain.defineCommand({
          id: 'id',
          name: 'name',
          aggregateId: 'aggregate.id',
          context: 'context.name',
          aggregate: 'aggregate.name',
          payload: 'payload',
          revision: 'revision',
          version: 'version',
          meta: 'meta'
        });
        domain.defineEvent({
          correlationId: 'correlationId',
          id: 'id',
          name: 'name',
          aggregateId: 'aggregate.id',
          context: 'context.name',
          aggregate: 'aggregate.name',
          payload: 'payload',
          revision: 'revision',
          version: 'version',
          meta: 'meta'
        });

        domain.init(function (err) {
          domain.eventStore = oldEventStore;
          domain.tree.useEventStore(domain.eventStore);
          done(err);
        });
      });

      describe('and continuing with the v2 domain', function () {

        it('it should work as expected', function (done) {

          async.eachSeries(v1CommandsForV2, function (cmd, callback) {
            domain.handle(cmd, function (err, evts, aggData, meta) {

              if (cmd.meta.shouldFail) {
                expect(err).to.be.ok();
                expect(err.name).to.eql('BusinessRuleError');
                expect(err.message).to.eql('email already used');

                return callback();
              }

              expect(err).not.to.be.ok();
              expect(evts.length).to.eql(1);
              expect(evts[0].name).to.eql('enteredNewPerson');
              expect(evts[0].payload).to.eql(cmd.payload);
              expect(evts[0].meta).to.eql(cmd.meta);
              expect(evts[0].revision).to.eql(cmd.revision + 1);

              expect(meta.aggregateId).to.eql(cmd.aggregate.id);
              expect(meta.aggregate).to.eql(cmd.aggregate.name);
              expect(meta.context).to.eql(cmd.context.name);

              callback();
            });
          }, done);

        });

      });

    });

  });

});
