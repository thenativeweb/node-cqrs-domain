var expect = require('expect.js'),
  CommandDispatcher = require('../../lib/commandDispatcher');

describe('commandDispatcher', function () {

  describe('creating a new instance', function () {
    
    describe('without tree argument', function () {

      it('it should throw an error', function () {

        expect(function () {
          new CommandDispatcher();
        }).to.throwError(/tree/);

      });
      
    });

    describe('without definition argument', function () {

      it('it should throw an error', function () {

        expect(function () {
          new CommandDispatcher({ getCommandHandler: function () {} });
        }).to.throwError(/definition/);

      });

    });

    describe('with all correct arguments', function () {

      it('it should not throw an error', function () {

        expect(function () {
          new CommandDispatcher({ getCommandHandler: function () {} }, {});
        }).not.to.throwError();

      });
      
      describe('calling getTargetInformation', function () {

        describe('without command argument', function () {

          it('it should throw an error', function () {

            var cmdDisp = new CommandDispatcher({ getCommandHandler: function () {} }, {});
            expect(function () {
              cmdDisp.getTargetInformation();
            }).to.throwError(/command/);

          });

        });

        describe('with command argument', function () {

          it('it should not throw an error', function () {

            var cmdDisp = new CommandDispatcher({ getCommandHandler: function () {} }, {});
            expect(function () {
              cmdDisp.getTargetInformation({});
            }).not.to.throwError();

          });
          
          describe('passing a definition with all infos', function () {

            it('it should return the correct target infos', function () {

              var cmdDisp = new CommandDispatcher({ getCommandHandler: function () {} }, { name: 'cmdName', aggregateId: 'aggId', version: 'v', aggregate: 'agg', context: 'ctx' });
              var target = cmdDisp.getTargetInformation({ cmdName: 'cmdNameSpec', aggId: 'aggIdSpec', v: 3, agg: 'aggName', ctx: 'myCtx' });
              expect(target.name).to.eql('cmdNameSpec');
              expect(target.aggregateId).to.eql('aggIdSpec');
              expect(target.version).to.eql(3);
              expect(target.aggregate).to.eql('aggName');
              expect(target.context).to.eql('myCtx');

            });
            
          });

          describe('passing a definition with less infos', function () {

            it('it should return the correct target infos', function () {

              var cmdDisp = new CommandDispatcher({ getCommandHandler: function () {} }, { name: 'cmdName', aggregateId: 'aggId' });
              var target = cmdDisp.getTargetInformation({ cmdName: 'cmdNameSpec', aggId: 'aggIdSpec' });
              expect(target.name).to.eql('cmdNameSpec');
              expect(target.aggregateId).to.eql('aggIdSpec');
              expect(target.version).to.eql(0);

            });

          });

        });
        
      });
      
      describe('calling dispatch', function () {

        describe('with no matching commandHandler', function () {

          it('it should callback with an error', function (done) {

            var cmdDisp = new CommandDispatcher({ getCommandHandler: function () {
              return null;
            }, getCommandHandlerByOldTarget: function () { return null;}}, { name: 'cmdName', aggregateId: 'aggId' });
            cmdDisp.dispatch({ cmdName: 'cmdNameSpec', aggId: 'aggIdSpec' }, function (err) {
              expect(err).to.be.ok();
              expect(err.message).to.match(/no command/i);
              done();
            });
            
          });

        });
        
        describe('with matching commandHandler', function () {

          it('it should call his handle function', function (done) {

            var calledBack = false;
            var cmdDisp = new CommandDispatcher({ getCommandHandler: function () {
              return { handle: function (cmd, clb) {
                expect(cmd.cmdName).to.eql('cmdNameSpec');
                expect(clb).to.be.a('function');
                calledBack = true;
                clb(null);
              }};
            }}, { name: 'cmdName', aggregateId: 'aggId' });
            
            cmdDisp.dispatch({ cmdName: 'cmdNameSpec', aggId: 'aggIdSpec' }, function (err) {
              expect(err).not.to.be.ok();
              expect(calledBack).to.eql(true);
              done();
            });

          });
          
        });
        
      });

    });
    
  });

});
