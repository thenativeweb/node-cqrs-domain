var expect = require('expect.js'),
  AggregateModel = require('../../lib/aggregateModel');

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

      it('it should return a correct object', function() {

        var agg = new AggregateModel('1234');

        expect(agg).to.be.an('object');
        expect(agg.set).to.be.a('function');
        expect(agg.get).to.be.a('function');
        expect(agg.has).to.be.a('function');
        expect(agg.toJSON).to.be.a('function');
        expect(agg.destroy).to.be.a('function');
        expect(agg.isDestroyed).to.be.a('function');
        expect(agg.setRevision).to.be.a('function');
        expect(agg.getRevision).to.be.a('function');
        expect(agg.getUncommittedEvents).to.be.a('function');
        expect(agg.addUncommittedEvent).to.be.a('function');
        expect(agg.clearUncommittedEvents).to.be.a('function');
        expect(agg.reset).to.be.a('function');
        
        expect(agg.id).to.eql('1234');
        expect(agg.get('id')).to.eql('1234');

      });

    });

    describe('calling has', function() {

      describe('of an attribute that does exist', function() {

        it('it should return true', function() {

          var agg = new AggregateModel('123456');
          agg.set('a', 'b');
          
          expect(agg.has('id')).to.eql(true);
          expect(agg.has('a')).to.eql(true);

        });

      });

      describe('of an attribute that does not exist', function() {

        it('it should return false', function() {

          var agg = new AggregateModel('123456');

          expect(agg.has('data222')).to.eql(false);

        });

      });

    });

    describe('calling get', function() {

      describe('of an attribute that does exist', function() {

        it('it should return that value', function() {

          var agg = new AggregateModel('123456');
          agg.set('my', 'data');

          expect(agg.get('my')).to.eql('data');

        });

      });

      describe('of an attribute that does not exist', function() {

        it('it should return undefined', function() {

          var agg = new AggregateModel('123456');

          expect(agg.get('data222')).to.eql(undefined);

        });

      });

      describe('of an attribute that is deep', function() {

        it('it should return that value', function() {

          var agg = new AggregateModel('123456');
          agg.set('deep', { data: 'other stuff' });

          expect(agg.get('deep.data')).to.eql('other stuff');

        });

      });

    });

    describe('calling set', function() {

      describe('with a simple key', function() {

        it('it should set it correctly', function() {

          var agg = new AggregateModel('123456');

          agg.set('data', 'a');
          expect(agg.get('data')).to.eql('a');

        });

      });

      describe('with a path as key', function() {

        it('it should set it correctly', function() {

          var agg = new AggregateModel('123456');

          agg.set('path.sub', 'b');
          expect(agg.get('path.sub')).to.eql('b');

        });

      });

      describe('with an object', function() {

        it('it should set it correctly', function() {

          var agg = new AggregateModel('123456');

          agg.set({ tree: 'a', bee: { oh: '3' } });
          expect(agg.get('tree')).to.eql('a');
          expect(agg.get('bee.oh')).to.eql('3');

        });

      });

    });

    describe('calling destroy', function() {

      it('it should mark the vm as to be deleted', function() {

        var agg = new AggregateModel('123456');
        
        expect(agg.isDestroyed()).to.eql(false);
        
        agg.destroy();

        expect(agg.isDestroyed()).to.eql(true);

      });

    });

    describe('calling toJSON', function() {

      it('it should return all attributes as Javascript object', function() {

        var agg = new AggregateModel('123456');
        agg.set('data', 'other stuff');
        agg.set('deeper', { a: 'b' });
        var json = agg.toJSON();

        expect(json.id).to.eql('123456');
        expect(json.data).to.eql('other stuff');
        expect(json.deeper.a).to.eql('b');

        expect(json._revision).to.eql(0);
        expect(json._destroyed).to.eql(false);

      });
      
      describe('having set a revision and having destroyed the aggregate', function () {

        it('it should return all attributes as Javascript object', function() {

          var agg = new AggregateModel('123456');
          agg.setRevision({ context: 'c', aggregate: 'a', aggregateId: 'id' }, 3);
          
          agg.set('data', 'other stuff');
          agg.set('deeper', { a: 'b' });
          
          agg.destroy();
          
          var json = agg.toJSON();

          expect(json.id).to.eql('123456');
          expect(json.data).to.eql('other stuff');
          expect(json.deeper.a).to.eql('b');

          expect(json._revision).to.eql(3);
          expect(json._revisions['c.a.id']).to.eql(3);
          expect(json._destroyed).to.eql(true);

        });
        
      });

    });
    
    describe('setting a revision', function () {
      
      it('it should work as expected', function () {
        
        var agg = new AggregateModel('1234456745');
        
        expect(agg.getRevision()).to.eql(0);
        
        agg.setRevision({ context: 'c', aggregate: 'a', aggregateId: 'id' }, 8);

        expect(agg.getRevision({ context: 'c', aggregate: 'a', aggregateId: 'id' })).to.eql(8);
        
      });
      
    });

    describe('mark aggregate as destroyed', function () {

      it('it should work as expected', function () {

        var agg = new AggregateModel('1234456745');

        expect(agg.isDestroyed()).to.eql(false);

        agg.destroy();

        expect(agg.isDestroyed()).to.eql(true);

      });

    });

    describe('adding uncommitted events', function () {

      it('it should work as expected', function () {

        var agg = new AggregateModel('1234456745');
        var evts = agg.getUncommittedEvents();
        
        expect(evts).to.be.an('array');
        expect(evts.length).to.eql(0);

        agg.addUncommittedEvent({ my: 'evt' });
        agg.addUncommittedEvent({ my2: 'evt2' });
        
        evts = agg.getUncommittedEvents();

        expect(evts).to.be.an('array');
        expect(evts.length).to.eql(2);
        expect(evts[0].my).to.eql('evt');
        expect(evts[1].my2).to.eql('evt2');

      });

    });

    describe('clearing uncommitted events', function () {

      it('it should work as expected', function () {

        var agg = new AggregateModel('1234456745');
        var evts = agg.getUncommittedEvents();

        expect(evts).to.be.an('array');
        expect(evts.length).to.eql(0);

        agg.addUncommittedEvent({ my: 'evt' });
        agg.addUncommittedEvent({ my2: 'evt2' });

        evts = agg.getUncommittedEvents();

        expect(evts).to.be.an('array');
        expect(evts.length).to.eql(2);
        expect(evts[0].my).to.eql('evt');
        expect(evts[1].my2).to.eql('evt2');
        
        agg.clearUncommittedEvents();
        
        evts = agg.getUncommittedEvents();

        expect(evts).to.be.an('array');
        expect(evts.length).to.eql(0);

      });

    });

    describe('calling reset', function () {

      it('it should work as expected', function () {

        var agg = new AggregateModel('1234456745');

        agg.set('my', 'value');

        agg.setRevision({ context: 'c', aggregate: 'a', aggregateId: 'id' }, 8);
        
        agg.reset({ other: 'value', _revision: 8, _revisions: { 'c.a.id': 8 } });

        expect(agg.getRevision({ context: 'c', aggregate: 'a', aggregateId: 'id' })).to.eql(8);
        
        expect(agg.get('my')).not.to.be.ok();
        expect(agg.get('other')).to.eql('value');

      });

    });
    
  });

});
