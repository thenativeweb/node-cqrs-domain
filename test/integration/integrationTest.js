var expect = require('expect.js'),
  api = require('../../index');

describe('integration', function () {

  describe('set 1', function () {
    
    describe('format 1', function () {

      var domain;

      before(function (done) {
        domain = api({ domainPath: __dirname + '/fixture/set1', commandRejectedEventName: 'rejectedCommand' });
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

      describe('handling a command that will not be handled', function () {

        it('it should not publish any event and it should callback with an error and without events', function (done) {

          var publishedEvents = [];

          domain.onEvent(function (evt) {
            publishedEvents.push(evt);
          });

          var cmd = {
            id: 'cmdId',
            name: 'cmdName',
            aggregate: {
              id: 'aggregateId',
              name: 'aggregate'
            },
            context: {
              name: 'context'
            },
            payload: 'payload',
            revision: 0,
            version: 0,
            meta: {
              userId: 'userId'
            }
          };

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/found/i);
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(0);

            done();
          });

        });

      });

      describe('handling a command with correct command name but wrong aggregate and context', function () {

        it('it should not publish any event and it should callback with an error and without events', function (done) {

          var publishedEvents = [];

          domain.onEvent(function (evt) {
            publishedEvents.push(evt);
          });

          var cmd = {
            id: 'cmdId',
            name: 'enterNewPerson',
            aggregate: {
              id: 'aggregateId',
              name: 'aggregate'
            },
            context: {
              name: 'context'
            },
            payload: 'payload',
            revision: 0,
            version: 0,
            meta: {
              userId: 'userId'
            }
          };

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/found/i);
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(0);

            done();
          });

        });

      });

      describe('handling a command with correct command name and correct aggregate but wrong context', function () {

        it('it should not publish any event and it should callback with an error and without events', function (done) {

          var publishedEvents = [];

          domain.onEvent(function (evt) {
            publishedEvents.push(evt);
          });

          var cmd = {
            id: 'cmdId',
            name: 'enterNewPerson',
            aggregate: {
              id: 'aggregateId',
              name: 'person'
            },
            context: {
              name: 'context'
            },
            payload: 'payload',
            revision: 0,
            version: 0,
            meta: {
              userId: 'userId'
            }
          };

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/found/i);
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(0);

            done();
          });

        });

      });

      describe('handling a command', function () {

        describe('that does fails on the validation rules of a parent schema', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              idd: 'cmdId',
              name: 'enterNewPerson',
              aggregate: {
                id: 'aggregateId',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: {
                firstname: 'jack',
                lastname: 'doe',
                email: 'jack'
              },
              revision: 0,
              version: 0,
              meta: {
                userId: 'userId'
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('ValidationError');
              expect(evts).to.be.an('array');
              expect(evts.length).to.eql(1);
              expect(evts[0].name).to.eql('rejectedCommand');
              expect(evts[0].payload.reason.name).to.eql('ValidationError');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].name).to.eql('rejectedCommand');
              expect(publishedEvents[0].payload.reason.name).to.eql('ValidationError');
              
              expect(aggData).to.eql(null);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');
              expect(meta.context).to.eql('hr');

              done();
            });

          });

        });

        describe('that fails on the validation rules', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              name: 'enterNewPerson',
              aggregate: {
                id: 'aggregateId',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: 'payload',
              revision: 0,
              version: 0,
              meta: {
                userId: 'userId'
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('ValidationError');
              expect(evts).to.be.an('array');
              expect(evts.length).to.eql(1);
              expect(evts[0].name).to.eql('rejectedCommand');
              expect(evts[0].payload.reason.name).to.eql('ValidationError');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].name).to.eql('rejectedCommand');
              expect(publishedEvents[0].payload.reason.name).to.eql('ValidationError');

              expect(aggData).to.eql(null);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');
              expect(meta.context).to.eql('hr');

              done();
            });

          });

        });

        describe('that fails on a pre-condition', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              name: 'unregisterAllContactInformation',
              aggregate: {
                id: 'aggregateIdNew',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: {
              },
              revision: 0,
              version: 2,
              meta: {
                userId: 'userId'
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('BusinessRuleError');
              expect(evts).to.be.an('array');
              expect(evts.length).to.eql(1);
              expect(evts[0].name).to.eql('rejectedCommand');
              expect(evts[0].payload.reason.name).to.eql('BusinessRuleError');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].name).to.eql('rejectedCommand');
              expect(publishedEvents[0].payload.reason.name).to.eql('BusinessRuleError');

              expect(aggData).to.eql(null);
              expect(meta.aggregateId).to.eql('aggregateIdNew');
              expect(meta.aggregate).to.eql('person');
              expect(meta.context).to.eql('hr');

              done();
            });

          });

        });
        
        describe('that fails on a business rule', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              name: 'enterNewPerson',
              aggregate: {
                id: 'aggregateId',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: {
                firstname: 'jack',
                lastname: 'jack',
                email: 'jack'
              },
              revision: 0,
              version: 0,
              meta: {
                userId: 'userId'
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('BusinessRuleError');
              expect(evts).to.be.an('array');
              expect(evts.length).to.eql(1);
              expect(evts[0].name).to.eql('rejectedCommand');
              expect(evts[0].payload.reason.name).to.eql('BusinessRuleError');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].name).to.eql('rejectedCommand');
              expect(publishedEvents[0].payload.reason.name).to.eql('BusinessRuleError');

              expect(aggData).to.eql(null);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');
              expect(meta.context).to.eql('hr');

              done();
            });

          });

        });

        describe('that is completely valid', function () {

          it('it should publish a the resulting event and it should callback without an error and with events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              name: 'enterNewPerson',
              aggregate: {
                id: 'aggregateId',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: {
                firstname: 'jack',
                lastname: 'doe',
                email: 'jack'
              },
              revision: 0,
              version: 0,
              meta: {
                userId: 'userId'
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).not.to.be.ok();
              expect(evts.length).to.eql(1);
              expect(evts[0].name).to.eql('enteredNewPerson');
              expect(evts[0].payload).to.eql(cmd.payload);
              expect(evts[0].meta).to.eql(cmd.meta);
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].name).to.eql('enteredNewPerson');
              expect(publishedEvents[0].payload).to.eql(cmd.payload);
              expect(publishedEvents[0].meta).to.eql(cmd.meta);

              expect(aggData.lastname).to.eql('doe');
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');
              expect(meta.context).to.eql('hr');

              done();
            });

          });

        });

        describe('that generates 2 events', function () {

          it('it should publish a the resulting events and it should callback without an error and with events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              name: 'unregisterAllContactInformation',
              aggregate: {
                id: 'aggregateId',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: {
              },
              revision: 1,
              version: 2,
              meta: {
                userId: 'userId'
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).not.to.be.ok();
              expect(evts.length).to.eql(2);
              expect(evts[0].name).to.eql('unregisteredEMailAddress');
              expect(evts[0].payload.email).to.eql('default@mycomp.org');
              expect(evts[0].meta).to.eql(cmd.meta);
              expect(evts[1].name).to.eql('unregisteredEMailAddress');
              expect(evts[1].payload.email).to.eql('jack');
              expect(evts[1].meta).to.eql(cmd.meta);
              expect(publishedEvents.length).to.eql(2);
              expect(publishedEvents[0].name).to.eql('unregisteredEMailAddress');
              expect(publishedEvents[0].payload.email).to.eql('default@mycomp.org');
              expect(publishedEvents[0].meta).to.eql(cmd.meta);
              expect(publishedEvents[1].name).to.eql('unregisteredEMailAddress');
              expect(publishedEvents[1].payload.email).to.eql('jack');
              expect(publishedEvents[1].meta).to.eql(cmd.meta);

              expect(aggData.emails.length).to.eql(0);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');
              expect(meta.context).to.eql('hr');

              done();
            });

          });

        });

        describe('that has a custom command handler', function () {

          it('it use that handler', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              name: 'enterNewSpecialPerson',
              aggregate: {
                id: 'aggregateId',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: {
              },
              revision: 1,
              version: 0,
              meta: {
                userId: 'userId'
              }
            };

            domain.handle(cmd, function (err, evts) {
              expect(err).not.to.be.ok();
              expect(evts.length).to.eql(1);
              expect(evts[0].my).to.eql('special');
              expect(evts[0].ev).to.eql('ent');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].my).to.eql('special');
              expect(publishedEvents[0].ev).to.eql('ent');

              done();
            });

          });

        });

      });
      
    });

    describe('format 2', function () {

      var domain;

      before(function (done) {
        domain = api({ domainPath: __dirname + '/fixture/set1', commandRejectedEventName: 'rejectedCommand' });
        domain.defineCommand({
          id: 'id',
          name: 'command',
          aggregateId: 'payload.id',
          payload: 'payload',
          revision: 'head.revision'
        });
        domain.defineEvent({
          correlationId: 'commandId',
          id: 'id',
          name: 'event',
          aggregateId: 'payload.id',
          payload: 'payload',
          revision: 'head.revision'
        });

        domain.init(done);
      });

      describe('handling a command that will not be handled', function () {

        it('it should not publish any event and it should callback with an error and without events', function (done) {

          var publishedEvents = [];

          domain.onEvent(function (evt) {
            publishedEvents.push(evt);
          });

          var cmd = {
            id: 'cmdId',
            command: 'cmdName',
            payload: {
              id: 'aggregateId',
              data: 'data'
            },
            head: {
              userId: 'userId',
              revision: 0
            }
          };

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/found/i);
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(0);

            done();
          });

        });

      });

      describe('handling a command', function () {

        describe('that does fails on the validation rules of a parent schema', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              idd: 'cmdId',
              command: 'enterNewPerson',
              payload: {
                id: 'aggregateId',
                firstname: 'jack',
                lastname: 'doe',
                email: 'jack'
              },
              head: {
                userId: 'userId',
                revision: 0
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('cart');
              expect(meta.context).to.eql('_general');

              done();
            });

          });

        });

        describe('that has a custom command handler', function () {

          it('it use that handler', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              idd: 'cmdId',
              command: 'enterNewSpecialPerson',
              payload: {
                id: 'aggregateId'
              },
              head: {
                userId: 'userId',
                revision: 0
              }
            };

            domain.handle(cmd, function (err, evts) {
              expect(err).not.to.be.ok();
              expect(evts.length).to.eql(1);
              expect(evts[0].my).to.eql('special');
              expect(evts[0].ev).to.eql('ent');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].my).to.eql('special');
              expect(publishedEvents[0].ev).to.eql('ent');

              done();
            });

          });

        });

      });

    });
    
  });

  describe('set 2', function () {

    describe('format 2', function () {

      var domain;

      before(function (done) {
        domain = api({ domainPath: __dirname + '/fixture/set2', commandRejectedEventName: 'rejectedCommand' });
        domain.defineCommand({
          id: 'id',
          name: 'command',
          aggregateId: 'payload.id',
          payload: 'payload',
          revision: 'head.revision'
        });
        domain.defineEvent({
          correlationId: 'commandId',
          id: 'id',
          name: 'event',
          aggregateId: 'payload.id',
          payload: 'payload',
          revision: 'head.revision'
        });

        domain.init(done);
      });

      describe('handling a command that will not be handled', function () {

        it('it should not publish any event and it should callback with an error and without events', function (done) {

          var publishedEvents = [];

          domain.onEvent(function (evt) {
            publishedEvents.push(evt);
          });

          var cmd = {
            id: 'cmdId',
            command: 'cmdName',
            payload: {
              id: 'aggregateId',
              data: 'data'
            },
            head: {
              userId: 'userId',
              revision: 0
            }
          };

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/found/i);
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(0);

            done();
          });

        });

      });

      describe('handling a command', function () {

        describe('that does fails on the validation rules of a parent schema', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              idd: 'cmdId',
              command: 'enterNewPerson',
              payload: {
                id: 'aggregateId',
                firstname: 'jack',
                lastname: 'doe',
                email: 'jack'
              },
              head: {
                userId: 'userId',
                revision: 0
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('ValidationError');
              expect(evts).to.be.an('array');
              expect(evts.length).to.eql(1);
              expect(evts[0].event).to.eql('rejectedCommand');
              expect(evts[0].payload.reason.name).to.eql('ValidationError');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].event).to.eql('rejectedCommand');
              expect(publishedEvents[0].payload.reason.name).to.eql('ValidationError');

              expect(aggData).to.eql(null);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');

              done();
            });

          });

        });

        describe('that fails on the validation rules', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              idd: 'cmdId',
              command: 'enterNewPerson',
              payload: {
                id: 'aggregateId'
              },
              head: {
                userId: 'userId',
                revision: 0
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('ValidationError');
              expect(evts).to.be.an('array');
              expect(evts.length).to.eql(1);
              expect(evts[0].event).to.eql('rejectedCommand');
              expect(evts[0].payload.reason.name).to.eql('ValidationError');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].event).to.eql('rejectedCommand');
              expect(publishedEvents[0].payload.reason.name).to.eql('ValidationError');

              expect(aggData).to.eql(null);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');

              done();
            });

          });

        });

        describe('that fails on a pre-condition', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              command: 'unregisterAllContactInformation',
              payload: {
                id: 'aggregateIdNew'
              },
              head: {
                userId: 'userId',
                revision: 0
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('BusinessRuleError');
              expect(evts).to.be.an('array');
              expect(evts.length).to.eql(1);
              expect(evts[0].event).to.eql('rejectedCommand');
              expect(evts[0].payload.reason.name).to.eql('BusinessRuleError');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].event).to.eql('rejectedCommand');
              expect(publishedEvents[0].payload.reason.name).to.eql('BusinessRuleError');

              expect(aggData).to.eql(null);
              expect(meta.aggregateId).to.eql('aggregateIdNew');
              expect(meta.aggregate).to.eql('person');

              done();
            });

          });

        });

        describe('that fails on a business rule', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              command: 'enterNewPerson',
              payload: {
                id: 'aggregateId',
                firstname: 'jack',
                lastname: 'jack',
                email: 'jack'
              },
              head: {
                userId: 'userId',
                revision: 0
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('BusinessRuleError');
              expect(evts).to.be.an('array');
              expect(evts.length).to.eql(1);
              expect(evts[0].event).to.eql('rejectedCommand');
              expect(evts[0].payload.reason.name).to.eql('BusinessRuleError');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].event).to.eql('rejectedCommand');
              expect(publishedEvents[0].payload.reason.name).to.eql('BusinessRuleError');

              expect(aggData).to.eql(null);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');

              done();
            });

          });

        });

        describe('that is completely valid', function () {

          it('it should publish a the resulting event and it should callback without an error and with events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              command: 'enterNewPerson',
              payload: {
                id: 'aggregateId',
                firstname: 'jack',
                lastname: 'doe',
                email: 'jack'
              },
              head: {
                userId: 'userId',
                revision: 0
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).not.to.be.ok();
              expect(evts.length).to.eql(1);
              expect(evts[0].event).to.eql('enteredNewPerson');
              expect(evts[0].payload).to.eql(cmd.payload);
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].event).to.eql('enteredNewPerson');
              expect(publishedEvents[0].payload).to.eql(cmd.payload);

              expect(aggData.lastname).to.eql('doe');
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');

              done();
            });

          });

        });

        describe('that generates 2 events', function () {

          it('it should publish a the resulting events and it should callback without an error and with events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              command: 'unregisterAllContactInformation',
              payload: {
                id: 'aggregateId'
              },
              head: {
                userId: 'userId',
                revision: 1
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).not.to.be.ok();
              expect(evts.length).to.eql(2);
              expect(evts[0].event).to.eql('unregisteredEMailAddress');
              expect(evts[0].payload.email).to.eql('default@mycomp.org');
              expect(evts[1].event).to.eql('unregisteredEMailAddress');
              expect(evts[1].payload.email).to.eql('jack');
              expect(publishedEvents.length).to.eql(2);
              expect(publishedEvents[0].event).to.eql('unregisteredEMailAddress');
              expect(publishedEvents[0].payload.email).to.eql('default@mycomp.org');
              expect(publishedEvents[1].event).to.eql('unregisteredEMailAddress');
              expect(publishedEvents[1].payload.email).to.eql('jack');

              expect(aggData.emails.length).to.eql(0);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');

              done();
            });

          });

        });

        describe('that has a custom command handler', function () {

          it('it use that handler', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              idd: 'cmdId',
              command: 'enterNewSpecialPerson',
              payload: {
                id: 'aggregateId'
              },
              head: {
                userId: 'userId',
                revision: 0
              }
            };

            domain.handle(cmd, function (err, evts) {
              expect(err).not.to.be.ok();
              expect(evts.length).to.eql(1);
              expect(evts[0].my).to.eql('special');
              expect(evts[0].ev).to.eql('ent');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].my).to.eql('special');
              expect(publishedEvents[0].ev).to.eql('ent');

              done();
            });

          });

        });

      });

    });

    describe('format 1', function () {

      var domain;

      before(function (done) {
        domain = api({ domainPath: __dirname + '/fixture/set2', commandRejectedEventName: 'rejectedCommand' });
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

      describe('handling a command that will not be handled', function () {

        it('it should not publish any event and it should callback with an error and without events', function (done) {

          var publishedEvents = [];

          domain.onEvent(function (evt) {
            publishedEvents.push(evt);
          });

          var cmd = {
            id: 'cmdId',
            name: 'cmdName',
            aggregate: {
              id: 'aggregateId',
              name: 'aggregate'
            },
            context: {
              name: 'context'
            },
            payload: 'payload',
            revision: 0,
            version: 0,
            meta: {
              userId: 'userId'
            }
          };

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/found/i);
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(0);

            done();
          });

        });

      });

      describe('handling a command with correct command name but wrong aggregate and context', function () {

        it('it should not publish any event and it should callback with an error and without events', function (done) {

          var publishedEvents = [];

          domain.onEvent(function (evt) {
            publishedEvents.push(evt);
          });

          var cmd = {
            id: 'cmdId',
            name: 'enterNewPerson',
            aggregate: {
              id: 'aggregateId',
              name: 'aggregate'
            },
            context: {
              name: 'context'
            },
            payload: 'payload',
            revision: 0,
            version: 0,
            meta: {
              userId: 'userId'
            }
          };

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/found/i);
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(0);

            done();
          });

        });

      });

      describe('handling a command with correct command name and correct aggregate but wrong context', function () {

        it('it should not publish any event and it should callback with an error and without events', function (done) {

          var publishedEvents = [];

          domain.onEvent(function (evt) {
            publishedEvents.push(evt);
          });

          var cmd = {
            id: 'cmdId',
            name: 'enterNewPerson',
            aggregate: {
              id: 'aggregateId',
              name: 'person'
            },
            context: {
              name: 'context'
            },
            payload: 'payload',
            revision: 0,
            version: 0,
            meta: {
              userId: 'userId'
            }
          };

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/found/i);
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(0);

            done();
          });

        });

      });

      describe('handling a command', function () {

        describe('that does fails on the validation rules of a parent schema', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              idd: 'cmdId',
              name: 'enterNewPerson',
              aggregate: {
                id: 'aggregateId',
                name: 'person'
              },
//              context: {
//                name: 'hr'
//              },
              payload: {
                firstname: 'jack',
                lastname: 'doe',
                email: 'jack'
              },
              revision: 0,
              version: 0,
              meta: {
                userId: 'userId'
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('ValidationError');
              expect(evts).to.be.an('array');
              expect(evts.length).to.eql(1);
              expect(evts[0].name).to.eql('rejectedCommand');
              expect(evts[0].payload.reason.name).to.eql('ValidationError');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].name).to.eql('rejectedCommand');
              expect(publishedEvents[0].payload.reason.name).to.eql('ValidationError');

              expect(aggData).to.eql(null);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');

              done();
            });

          });

        });

        describe('that has a custom command handler', function () {

          it('it use that handler', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              name: 'enterNewSpecialPerson',
              aggregate: {
                id: 'aggregateId',
                name: 'person'
              },
//              context: {
//                name: 'hr'
//              },
              payload: {
              },
              revision: 1,
              version: 0,
              meta: {
                userId: 'userId'
              }
            };

            domain.handle(cmd, function (err, evts) {
              expect(err).not.to.be.ok();
              expect(evts.length).to.eql(1);
              expect(evts[0].my).to.eql('special');
              expect(evts[0].ev).to.eql('ent');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].my).to.eql('special');
              expect(publishedEvents[0].ev).to.eql('ent');

              done();
            });

          });

        });

      });

    });

  });

  describe('set 3', function () {

    describe('format 3', function () {

      var domain;

      before(function (done) {
        domain = api({ domainPath: __dirname + '/fixture/set2', commandRejectedEventName: 'rejectedCommand' });
        domain.defineCommand({
          id: 'id',
          name: 'command',
          aggregateId: 'payload.id',
          aggregate: 'agg',
          payload: 'payload',
          revision: 'head.revision'
        });
        domain.defineEvent({
          correlationId: 'commandId',
          id: 'id',
          name: 'event',
          aggregateId: 'payload.id',
          aggregate: 'agg',
          payload: 'payload',
          revision: 'head.revision'
        });

        domain.init(done);
      });

      describe('handling a command that will not be handled', function () {

        it('it should not publish any event and it should callback with an error and without events', function (done) {

          var publishedEvents = [];

          domain.onEvent(function (evt) {
            publishedEvents.push(evt);
          });

          var cmd = {
            id: 'cmdId',
            command: 'cmdName',
            agg: 'aggName',
            payload: {
              id: 'aggregateId',
              data: 'data'
            },
            head: {
              userId: 'userId',
              revision: 0
            }
          };

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/found/i);
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(0);

            done();
          });

        });

      });

      describe('handling a command', function () {

        describe('that does fails on the validation rules of a parent schema', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              idd: 'cmdId',
              command: 'enterNewPerson',
              agg: 'person',
              payload: {
                id: 'aggregateId',
                firstname: 'jack',
                lastname: 'doe',
                email: 'jack'
              },
              head: {
                userId: 'userId',
                revision: 0
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('ValidationError');
              expect(evts).to.be.an('array');
              expect(evts.length).to.eql(1);
              expect(evts[0].event).to.eql('rejectedCommand');
              expect(evts[0].payload.reason.name).to.eql('ValidationError');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].event).to.eql('rejectedCommand');
              expect(publishedEvents[0].payload.reason.name).to.eql('ValidationError');

              expect(aggData).to.eql(null);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');

              done();
            });

          });

        });

        describe('that fails on the validation rules', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              idd: 'cmdId',
              command: 'enterNewPerson',
              agg: 'person',
              payload: {
                id: 'aggregateId'
              },
              head: {
                userId: 'userId',
                revision: 0
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('ValidationError');
              expect(evts).to.be.an('array');
              expect(evts.length).to.eql(1);
              expect(evts[0].event).to.eql('rejectedCommand');
              expect(evts[0].payload.reason.name).to.eql('ValidationError');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].event).to.eql('rejectedCommand');
              expect(publishedEvents[0].payload.reason.name).to.eql('ValidationError');

              expect(aggData).to.eql(null);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');

              done();
            });

          });

        });

        describe('that fails on a business rule', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              command: 'enterNewPerson',
              agg: 'person',
              payload: {
                id: 'aggregateId',
                firstname: 'jack',
                lastname: 'jack',
                email: 'jack'
              },
              head: {
                userId: 'userId',
                revision: 0
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('BusinessRuleError');
              expect(evts).to.be.an('array');
              expect(evts.length).to.eql(1);
              expect(evts[0].event).to.eql('rejectedCommand');
              expect(evts[0].payload.reason.name).to.eql('BusinessRuleError');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].event).to.eql('rejectedCommand');
              expect(publishedEvents[0].payload.reason.name).to.eql('BusinessRuleError');

              expect(aggData).to.eql(null);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');

              done();
            });

          });

        });

        describe('that is completely valid', function () {

          it('it should publish a the resulting event and it should callback without an error and with events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              command: 'enterNewPerson',
              agg: 'person',
              payload: {
                id: 'aggregateId',
                firstname: 'jack',
                lastname: 'doe',
                email: 'jack'
              },
              head: {
                userId: 'userId',
                revision: 0
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).not.to.be.ok();
              expect(evts.length).to.eql(1);
              expect(evts[0].event).to.eql('enteredNewPerson');
              expect(evts[0].payload).to.eql(cmd.payload);
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].event).to.eql('enteredNewPerson');
              expect(publishedEvents[0].payload).to.eql(cmd.payload);

              expect(aggData.lastname).to.eql('doe');
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');

              done();
            });

          });

        });

        describe('that generates 2 events', function () {

          it('it should publish a the resulting events and it should callback without an error and with events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              command: 'unregisterAllContactInformation',
              agg: 'person',
              payload: {
                id: 'aggregateId'
              },
              head: {
                userId: 'userId',
                revision: 1
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).not.to.be.ok();
              expect(evts.length).to.eql(2);
              expect(evts[0].event).to.eql('unregisteredEMailAddress');
              expect(evts[0].payload.email).to.eql('default@mycomp.org');
              expect(evts[1].event).to.eql('unregisteredEMailAddress');
              expect(evts[1].payload.email).to.eql('jack');
              expect(publishedEvents.length).to.eql(2);
              expect(publishedEvents[0].event).to.eql('unregisteredEMailAddress');
              expect(publishedEvents[0].payload.email).to.eql('default@mycomp.org');
              expect(publishedEvents[1].event).to.eql('unregisteredEMailAddress');
              expect(publishedEvents[1].payload.email).to.eql('jack');

              expect(aggData.emails.length).to.eql(0);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');

              done();
            });

          });

        });

        describe('that has a custom command handler', function () {

          it('it use that handler', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              idd: 'cmdId',
              command: 'enterNewSpecialPerson',
              agg: 'person',
              payload: {
                id: 'aggregateId'
              },
              head: {
                userId: 'userId',
                revision: 0
              }
            };

            domain.handle(cmd, function (err, evts) {
              expect(err).not.to.be.ok();
              expect(evts.length).to.eql(1);
              expect(evts[0].my).to.eql('special');
              expect(evts[0].ev).to.eql('ent');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].my).to.eql('special');
              expect(publishedEvents[0].ev).to.eql('ent');

              done();
            });

          });

        });

      });

    });

    describe('format 1', function () {

      var domain;

      before(function (done) {
        domain = api({ domainPath: __dirname + '/fixture/set2', commandRejectedEventName: 'rejectedCommand' });
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

      describe('handling a command that will not be handled', function () {

        it('it should not publish any event and it should callback with an error and without events', function (done) {

          var publishedEvents = [];

          domain.onEvent(function (evt) {
            publishedEvents.push(evt);
          });

          var cmd = {
            id: 'cmdId',
            name: 'cmdName',
            aggregate: {
              id: 'aggregateId',
              name: 'aggregate'
            },
            context: {
              name: 'context'
            },
            payload: 'payload',
            revision: 0,
            version: 0,
            meta: {
              userId: 'userId'
            }
          };

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/found/i);
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(0);

            done();
          });

        });

      });

      describe('handling a command with correct command name but wrong aggregate and context', function () {

        it('it should not publish any event and it should callback with an error and without events', function (done) {

          var publishedEvents = [];

          domain.onEvent(function (evt) {
            publishedEvents.push(evt);
          });

          var cmd = {
            id: 'cmdId',
            name: 'enterNewPerson',
            aggregate: {
              id: 'aggregateId',
              name: 'aggregate'
            },
            context: {
              name: 'context'
            },
            payload: 'payload',
            revision: 0,
            version: 0,
            meta: {
              userId: 'userId'
            }
          };

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/found/i);
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(0);

            done();
          });

        });

      });

      describe('handling a command with correct command name and correct aggregate but wrong context', function () {

        it('it should not publish any event and it should callback with an error and without events', function (done) {

          var publishedEvents = [];

          domain.onEvent(function (evt) {
            publishedEvents.push(evt);
          });

          var cmd = {
            id: 'cmdId',
            name: 'enterNewPerson',
            aggregate: {
              id: 'aggregateId',
              name: 'person'
            },
            context: {
              name: 'context'
            },
            payload: 'payload',
            revision: 0,
            version: 0,
            meta: {
              userId: 'userId'
            }
          };

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.message).to.match(/found/i);
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(0);

            done();
          });

        });

      });

      describe('handling a command', function () {

        describe('that does fails on the validation rules of a parent schema', function () {

          it('it should publish a command rejected event and it should callback with an error and without events', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              idd: 'cmdId',
              name: 'enterNewPerson',
              aggregate: {
                id: 'aggregateId',
                name: 'person'
              },
//              context: {
//                name: 'hr'
//              },
              payload: {
                firstname: 'jack',
                lastname: 'doe',
                email: 'jack'
              },
              revision: 0,
              version: 0,
              meta: {
                userId: 'userId'
              }
            };

            domain.handle(cmd, function (err, evts, aggData, meta) {
              expect(err).to.be.ok();
              expect(err.name).to.eql('ValidationError');
              expect(evts).to.be.an('array');
              expect(evts.length).to.eql(1);
              expect(evts[0].name).to.eql('rejectedCommand');
              expect(evts[0].payload.reason.name).to.eql('ValidationError');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].name).to.eql('rejectedCommand');
              expect(publishedEvents[0].payload.reason.name).to.eql('ValidationError');

              expect(aggData).to.eql(null);
              expect(meta.aggregateId).to.eql('aggregateId');
              expect(meta.aggregate).to.eql('person');

              done();
            });

          });

        });

        describe('that has a custom command handler', function () {

          it('it use that handler', function (done) {

            var publishedEvents = [];

            domain.onEvent(function (evt) {
              publishedEvents.push(evt);
            });

            var cmd = {
              id: 'cmdId',
              name: 'enterNewSpecialPerson',
              aggregate: {
                id: 'aggregateId',
                name: 'person'
              },
//              context: {
//                name: 'hr'
//              },
              payload: {
              },
              revision: 1,
              version: 0,
              meta: {
                userId: 'userId'
              }
            };

            domain.handle(cmd, function (err, evts) {
              expect(err).not.to.be.ok();
              expect(evts.length).to.eql(1);
              expect(evts[0].my).to.eql('special');
              expect(evts[0].ev).to.eql('ent');
              expect(publishedEvents.length).to.eql(1);
              expect(publishedEvents[0].my).to.eql('special');
              expect(publishedEvents[0].ev).to.eql('ent');

              done();
            });

          });

        });

      });

    });

  });


  describe('Set independent', function () {
    var domain;

    beforeEach(function (done) {
      domain = api({domainPath: __dirname + '/fixture/minimalSet'});
      domain.init(done);
    });

    it('should not die for invalid commands', function (done) {
      expect(function () {
        domain.handle({}, function () {
          done();
        });
      }).to.not.throwError();

    });

    it('should emit commandRejected event', function (done) {
        domain.handle({}, function (err, events) {
          expect(err).not.to.be(undefined);
          expect(err.name).to.be('ValidationError');
          expect(err.message).to.contain('No command name given');
          expect(events).to.be.an('array');
          expect(events.length).to.be(1);
          expect(events[0].name).to.be('commandRejected');
          expect(events[0].payload.reason.name).to.be('ValidationError');

          done();
        });

    });


  });
});
