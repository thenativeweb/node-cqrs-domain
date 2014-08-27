var expect = require('expect.js'),
  api = require('../');

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

      });

    });

  });

});