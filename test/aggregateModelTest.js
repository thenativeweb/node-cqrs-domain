var expect = require('expect.js'),
  AggregateModel = require('../lib/aggregateModel');

describe('aggregate model', function () {

  describe('creating a new instance', function () {
    
    describe('without any arguments', function () {
      
      it('it should throw an error', function () {
        
        expect(function () {
          new AggregateModel();
        }).to.throwError(/id/);
        
      });
      
    });

    describe('with an id as number', function () {

      it('it should throw an error', function () {

        expect(function () {
          new AggregateModel(1234);
        }).to.throwError(/id/);

      });

    });
    
    describe('with an id as string', function () {

      it('it should not throw an error', function () {

        expect(function () {
          new AggregateModel('12345');
        }).not.to.throwError();

      });

    });
    
  });

});
