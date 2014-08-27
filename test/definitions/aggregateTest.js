var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../../lib/definitionBase'),
  Aggregate = require('../../lib/definitions/aggregate'),
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
      expect(aggr.isSnapshotThresholdNeeded).to.be.a('function');

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
    
  });

});
