'use strict';

var debug = require('debug')('domain:validator'),
  _ = require('lodash'),
  tv4Module = require('tv4'),
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

  var tv4 = tv4Module.freshApi();

  _.each(options.schemas, function (v, k) {
    tv4.addSchema(k, v);
  });

  tv4.addFormat(options.formats);

  return function (data) {
    var validation = tv4.validateMultiple(data, schema);

    if (validation.missing.length > 0) {
      var missingString = validation.missing[0];

      for (var m = 1, lenM = validation.missing.length; m < lenM; m++) {
        missingString += ', ' + validation.missing[m];
      }

      var err = new Error('Validation schema(s) "' + missingString + '" missing!');
      debug(err);
      return err;
    }

    if (!validation.valid) {
      var errors = validation.errors;
      var firstError = validation.errors[0];
      if (firstError.message.indexOf('not match any schemas') >= 0 && firstError.subErrors && firstError.subErrors.length > 0) {
        firstError = firstError.subErrors[0];
        errors = firstError.subErrors;
      }
      return new ValidationError(firstError.dataPath + ' => ' + firstError.message, errors);
    }

    return null;
  };
}

module.exports = getValidator;
