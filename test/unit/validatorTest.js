var expect = require('expect.js'),
  validator = require('../../lib/validator');

describe('validator', function () {

  describe('executing', function () {

    describe('without any arguments', function () {

      it('it should throw an error', function () {

        expect(function () {
          validator();
        }).to.throwError(/schema/);

      });

    });

    describe('with wrong tv4 argument', function () {

      it('it should throw an error', function () {

        expect(function () {
          validator({});
        }).to.throwError(/schema/);

      });

    });

    describe('with all correct arguments', function () {

      describe('validating', function () {

        var val = validator({}, {
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

      var formats = require('tv4-formats');

      describe('validating an email address with format property', function() {
        var emailValidation = validator({ formats: formats }, {
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
