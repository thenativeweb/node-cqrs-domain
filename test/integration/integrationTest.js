var expect = require('expect.js'),
  api = require('../../index');

describe('integration', function () {

  describe('set1', function () {
    
    var domain;
    
    before(function (done) {
      domain = api({ domainPath: __dirname + '/fixture/set1' });
      domain.defineCommand({
        id: 'i',
        name: 'n',
        aggregateId: 'ai',
        context: 'c',
        aggregate: 'a',
        payload: 'p',
        revision: 'r',
        version: 'v',
        meta: 'm'
      });
      domain.defineEvent({
        correlationId: 'corr',
        id: 'i',
        name: 'n',
        aggregateId: 'ai',
        context: 'c',
        aggregate: 'a',
        payload: 'p',
        revision: 'r',
        version: 'v',
        meta: 'm'
      });
      
      domain.init(done);
    });
    
    describe('handling a command will not be handled', function () {
      
      it('it should work as expected', function (done) {

        var publishedEvents = [];
        
        domain.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var cmd = { i: 'cmdId', n: 'cmdName', ai: 'aggregateId', c: 'context', p: 'payload', r: 'revision', v: 'version', m: 'meta' };
        
        domain.handle(cmd, function (err, evts) {
          expect(err).to.be.ok();
          expect(evts).not.to.be.ok();
          expect(publishedEvents.length).to.eql(0);
          
          done();
        });
        
      });
      
    });
    
  });
  
});
