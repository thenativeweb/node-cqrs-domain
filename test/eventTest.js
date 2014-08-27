var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../lib/definitionBase'),
  Event = require('../lib/definitions/event');

describe('event definition', function () {

  describe('creating a new event definition', function () {
    
    describe('without any arguments', function () {

      it('it should throw an error', function () {

        expect(function () {
          new Event();
        }).to.throwError(/function/);

      });
      
    });

    describe('without event function', function () {

      it('it should throw an error', function () {

        expect(function () {
          new Event(null);
        }).to.throwError(/function/);

      });

    });

    describe('with a wrong event function', function () {

      it('it should throw an error', function () {

        expect(function () {
          new Event(null, 'not a function');
        }).to.throwError(/function/);

      });

    });

    describe('with a correct event function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          new Event(null, function () {});
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var evtFn = function () {};
        var evt = new Event(null, evtFn);
        expect(evt).to.be.a(DefinitionBase);
        expect(evt.evtFn).to.eql(evtFn);
        expect(evt.version).to.eql(0);
        expect(evt.payload).to.eql('');
        expect(evt.definitions).to.be.an('object');
        expect(evt.definitions.command).to.be.an('object');
        expect(evt.definitions.event).to.be.an('object');
        expect(evt.defineCommand).to.be.a('function');
        expect(evt.defineEvent).to.be.a('function');
        expect(evt.defineOptions).to.be.a('function');
        expect(evt.apply).to.be.a('function');
        
      });

    });

    describe('with some meta infos and a correct event function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          new Event({ version: 3, payload: 'some.path' }, function () {});
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var evtFn = function () {};
        var evt = new Event({ version: 3, payload: 'some.path' }, evtFn);
        expect(evt).to.be.a(DefinitionBase);
        expect(evt.evtFn).to.eql(evtFn);
        expect(evt.version).to.eql(3);
        expect(evt.payload).to.eql('some.path');
        expect(evt.options).to.be.an('object');
        expect(evt.definitions).to.be.an('object');
        expect(evt.definitions.command).to.be.an('object');
        expect(evt.definitions.event).to.be.an('object');
        expect(evt.defineCommand).to.be.a('function');
        expect(evt.defineEvent).to.be.a('function');
        expect(evt.defineOptions).to.be.a('function');
        expect(evt.apply).to.be.a('function');

      });

    });
    
    describe('applying an event', function () {
      
      describe('with default payload', function () {

        it('it should work as expected', function (done) {
          var evtObj = { my: 'event', with: { deep: 'value' } };
          var aggregateObj = {};

          var evtFn = function (evt, aggregateModel) {
            expect(evt).to.eql(evtObj);
            expect(aggregateModel).to.eql(aggregateObj);
            done();
          };

          var evt = new Event({}, evtFn);

          evt.apply(evtObj, aggregateObj);
        });
        
      });

      describe('with default payload', function () {

        it('it should work as expected', function (done) {
          var evtObj = { my: 'event', with: { deep: 'value' } };
          var aggregateObj = {};

          var evtFn = function (evt, aggregateModel) {
            expect(evt).to.eql(evtObj.with);
            expect(aggregateModel).to.eql(aggregateObj);
            done();
          };

          var evt = new Event({ payload: 'with' }, evtFn);

          evt.apply(evtObj, aggregateObj);
        });

      });
      
    });
    
  });

});