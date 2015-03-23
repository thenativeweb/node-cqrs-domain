'use strict';

var debug = require('debug')('domain:validator'),
  _ = require('lodash'),
  validator = require('is-my-json-valid'),
  ValidationError = require('./errors/validationError');

/**
 * Returns a validator function.
 * @param {Object} options The options object.
 * @param {Object} schema  The schema object.
 * @returns {Function}
 */
function getValidator (options, schema) {
  options = options || {};
  options.schemas = options.schemas || {};
  options.formats = options.formats || {};

  if (!schema || !_.isObject(schema)) {
    var err = new Error('Please pass a valid schema!');
    debug(err);
    throw err;
  }

  return function (data) {
    var validate = validator(schema, {
      schemas: options.schemas,
      formats: options.formats,
      verbose: true,
      greedy: true
    });

    var validation = validate(data);

    if (validate.missing && validate.missing.length > 0) {
      var missingString = validation.missing[0];

      for (var m = 1, lenM = validation.missing.length; m < lenM; m++) {
        missingString += ', ' + validation.missing[m];
      }

      var err = new Error('Validation schema(s) "' + missingString + '" missing!');
      debug(err);
      return err;
    }

    if (!validation) {
      var firstError = validate.errors[0];
      return new ValidationError(firstError.field + ' => ' + firstError.message, validate.errors);
    }

    return null;
  };
}

module.exports = getValidator;
