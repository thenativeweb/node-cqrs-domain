var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../../lib/definitionBase'),
  Context = require('../../lib/definitions/context'),
  Aggregate = require('../../lib/definitions/aggregate'),
  api = require('../../');

describe('context definition', function () {

  describe('creating a new context definition', function () {

    it('it should not throw an error', function () {

      expect(function () {
        api.defineContext();
      }).not.to.throwError();

    });

    it('it should return a correct object', function () {

      var ctx = api.defineContext();
      expect(ctx).to.be.a(DefinitionBase);
      expect(ctx).to.be.an(Context);
      expect(ctx.definitions).to.be.an('object');
      expect(ctx.definitions.command).to.be.an('object');
      expect(ctx.definitions.event).to.be.an('object');
      expect(ctx.defineCommand).to.be.a('function');
      expect(ctx.defineEvent).to.be.a('function');
      expect(ctx.defineOptions).to.be.a('function');

      expect(ctx.addAggregate).to.be.a('function');
      expect(ctx.getAggregate).to.be.a('function');
      expect(ctx.getAggregateForCommand).to.be.a('function');
      expect(ctx.getAggregates).to.be.a('function');

    });
    
    describe('having not added anything', function () {
      
      var ctx = api.defineContext();

      describe('calling getAggregates', function () {
        
        it('it should return an empty array', function () {
          
          var aggs = ctx.getAggregates();
          expect(aggs).to.be.an('array');
          expect(aggs.length).to.eql(0);
          
        });
        
      });

      describe('calling getAggregate with any name', function () {

        it('it should return an empty array', function () {

          var agg = ctx.getAggregate('blabla');
          expect(agg).not.to.be.ok();

        });

      });

      describe('calling getAggregate with a non-string name', function () {

        it('it should return an empty array', function () {

          expect(function () {
            ctx.getAggregate(3);
          }).to.throwError(/name/);

        });

      });

      describe('calling getAggregate without name', function () {

        it('it should return an empty array', function () {

          expect(function () {
            ctx.getAggregate();
          }).to.throwError(/name/);

        });

      });

      describe('calling getAggregateForCommand without name', function () {

        it('it should return an empty array', function () {

          expect(function () {
            ctx.getAggregateForCommand();
          }).to.throwError(/name/);

        });

      });

      describe('calling getAggregateForCommand with a non-string name', function () {

        it('it should return an empty array', function () {

          expect(function () {
            ctx.getAggregateForCommand(1);
          }).to.throwError(/name/);

        });

      });

      describe('calling getAggregateForCommand with any name but without version', function () {

        it('it should return an empty array', function () {

          var agg = ctx.getAggregateForCommand('blablaCmd');
          expect(agg).not.to.be.ok();

        });

      });

      describe('calling getAggregateForCommand with any name and version', function () {

        it('it should return an empty array', function () {

          var agg = ctx.getAggregateForCommand('blablaCmd', 0);
          expect(agg).not.to.be.ok();

        });

      });
      
    });

    describe('adding an aggregate', function () {
      
      describe('without passing an object', function () {

        it('it should throw an error', function () {

          var ctx = api.defineContext();
          
          expect(function () {
            ctx.addAggregate();
          }).to.throwError(/Aggregate/);

        });
        
      });

      describe('with a wrong object', function () {

        it('it should throw an error', function () {

          var ctx = api.defineContext();

          expect(function () {
            ctx.addAggregate({ some: 'obj' });
          }).to.throwError(/Aggregate/);

        });

      });

      describe('with a correct object', function () {

        it('it should not throw an error', function () {

          var ctx = api.defineContext();

          expect(function () {
            ctx.addAggregate(new Aggregate());
          }).not.to.throwError();

        });

        describe('and call getAggregates', function () {

          var ctx, agg1, agg2;

          beforeEach(function () {
            ctx = api.defineContext();

            agg1 = new Aggregate({ name: 'agg1' });
            agg2 = new Aggregate({ name: 'agg2' });

            ctx.addAggregate(agg1);
            ctx.addAggregate(agg2);
          });

          it('it should work as expected', function () {

            var aggs = ctx.getAggregates();
            
            expect(aggs).to.be.an('array');
            expect(aggs.length).to.eql(2);
            expect(aggs[0].name).to.eql(agg1.name);
            expect(aggs[1].name).to.eql(agg2.name);

          });
          
        });

        describe('and call getAggregate', function () {

          var ctx, agg1, agg2;

          beforeEach(function () {
            ctx = api.defineContext();

            agg1 = new Aggregate({ name: 'agg1' });
            agg2 = new Aggregate({ name: 'agg2' });

            ctx.addAggregate(agg1);
            ctx.addAggregate(agg2);
          });

          it('it should work as expected', function () {

            var aggFirst = ctx.getAggregate('agg1');
            expect(aggFirst.name).to.eql(agg1.name);

            var aggSecond = ctx.getAggregate('agg2');
            expect(aggSecond.name).to.eql(agg2.name);

          });

        });

        describe('and call getAggregateForCommand', function () {

          var ctx, agg1, agg2;

          beforeEach(function () {
            ctx = api.defineContext();

            agg1 = new Aggregate({ name: 'agg1' });
            agg1.getCommand = function (name, version) {
              if (name !== 'cmd1') {
                return null;
              }
              return { name: name, version: version};
            };
            
            agg2 = new Aggregate({ name: 'agg2' });
            agg2.getCommand = function (name, version) {
              if (name !== 'cmd2' || version !== 3) {
                return null;
              }
              return { name: name, version: version};
            };

            ctx.addAggregate(agg1);
            ctx.addAggregate(agg2);
          });

          it('it should work as expected', function () {

            var aggFirst = ctx.getAggregateForCommand('cmd1');
            expect(aggFirst.name).to.eql(agg1.name);

            var aggSecond = ctx.getAggregateForCommand('cmd2', 3);
            expect(aggSecond.name).to.eql(agg2.name);

          });

        });

      });
      
    });

  });

});
