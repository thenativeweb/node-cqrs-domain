var expect = require('expect.js'),
  validator = require('../../lib/validator'),
  tv4 = require('tv4');

describe('validator', function () {
  
  describe('executing', function () {
    
    describe('without any arguments', function () {
      
      it('it should throw an error', function () {

        expect(function () {
          validator();
        }).to.throwError(/tv4/);
        
      });
      
    });

    describe('with wrong tv4 argument', function () {

      it('it should throw an error', function () {

        expect(function () {
          validator({});
        }).to.throwError(/tv4/);

      });

    });

    describe('without schema argument', function () {

      it('it should throw an error', function () {

        expect(function () {
          validator({ validateMultiple: function () {} });
        }).to.throwError(/schema/);

      });

    });

    describe('with all correct arguments', function () {

      it('it should not throw an error', function () {

        expect(function () {
          validator({ validateMultiple: function () {}, addFormat: function () {} }, {});
        }).not.to.throwError();

      });

      it('it should return a function', function () {

        var fn = validator({ validateMultiple: function () {}, addFormat: function() { } }, {});
        expect(fn).to.be.a('function');
        
      });

      describe('validating', function () {

        var val = validator(tv4, {
          "type": "object",
          "properties": {
            "firstName": {
              "title": "First name",
              "type": "string"
            },
            "lastName": {
              "title": "Last name",
              "type": "string"
            }
          },
          "required": ["firstName"]
        });

        describe('a correct object', function () {

          it('it should return null', function () {

            var res = val({ firstName: 'First', lastName: 'Name' });
            expect(res).to.eql(null);

          });

        });

        describe('a wrong object', function () {

          it('it should return a valiation error', function () {

            var res = val({ lastName: 4 });
            expect(res.name).to.eql('ValidationError');
            expect(res.message).to.match(/missing/i);
            expect(res.more).to.be.an('array');
            expect(res.more.length).to.eql(2);
            expect(res.more[1].message).to.match(/invalid/i);
            expect(res.more[1].dataPath).to.match(/lastName/);

          });

        });
        
      });

    });
    
    describe('with additional tv4 formats', function() {
      
      describe('validating an email address with format property', function() {
        var emailValidation = validator(tv4, {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email'
            }
          }
        });
        
        it('should reject invalid email addresses', function() {
          var result = emailValidation({ email: 'test@example'});
          
          expect(result.name).to.eql('ValidationError');
        });
        
        it('should accept valid email addresses', function() {
          var result = emailValidation({ email: 'test-address+extension@example.com' });
          
          expect(result).to.eql(null);
        });
      });
    });
  });

});
