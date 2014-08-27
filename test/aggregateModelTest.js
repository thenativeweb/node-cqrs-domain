var expect = require('expect.js'),
  AggregateModel = require('../lib/aggregateModel');

describe('aggregate model', function () {

  describe('creating a new instance', function () {
    
    describe('without any arguments', function () {
      
      it('it should throw an error', function () {
        
        expect(function () {
          new AggregateModel();
        }).to.throwError(/name/);
        
      });
      
    });

    describe('only with an aggregate name', function () {

      it('it should throw an error', function () {

        expect(function () {
          new AggregateModel('myAgg');
        }).to.throwError(/id/);

      });

    });

    describe('only with an aggregate name and id', function () {

      it('it should throw an error', function () {

        expect(function () {
          new AggregateModel('myAgg', '12345');
        }).to.throwError(/version/);

      });

    });

    describe('with all required arguments', function () {

      it('it should not throw an error', function () {

        expect(function () {
          new AggregateModel('myAgg', '12345', 0);
        }).not.to.throwError();

      });

    });
    
  });

});
