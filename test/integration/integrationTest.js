var expect = require('expect.js'),
  api = require('../../index');

describe('integration', function () {

  describe('set1', function () {
    
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

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.name).to.eql('ValidationError');
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(1);
            expect(publishedEvents[0].name).to.eql('rejectedCommand');
            expect(publishedEvents[0].payload.reason.name).to.eql('ValidationError');

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

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.name).to.eql('ValidationError');
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(1);
            expect(publishedEvents[0].name).to.eql('rejectedCommand');
            expect(publishedEvents[0].payload.reason.name).to.eql('ValidationError');

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

          domain.handle(cmd, function (err, evts) {
            expect(err).to.be.ok();
            expect(err.name).to.eql('BusinessRuleError');
            expect(evts).not.to.be.ok();
            expect(publishedEvents.length).to.eql(1);
            expect(publishedEvents[0].name).to.eql('rejectedCommand');
            expect(publishedEvents[0].payload.reason.name).to.eql('BusinessRuleError');

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

          domain.handle(cmd, function (err, evts) {
            expect(err).not.to.be.ok();
            expect(evts.length).to.eql(1);
            expect(evts[0].name).to.eql('enteredNewPerson');
            expect(evts[0].payload).to.eql(cmd.payload);
            expect(publishedEvents.length).to.eql(1);
            expect(publishedEvents[0].name).to.eql('enteredNewPerson');
            expect(publishedEvents[0].payload).to.eql(cmd.payload);

            done();
          });

        });

      });

    });
    
  });
  
});
