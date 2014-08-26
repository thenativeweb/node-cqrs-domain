'use strict';

var debug = require('debug')('domain:validator'),
  ValidationError = require('./validationError');

function getValidator (tv4, schema) {
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
      var firstError = validation.errors[0];
      return new ValidationError(firstError.dataPath + ' => ' + firstError.message, validation.errors);      
    }
    
    return null;
  };
}

module.exports = getValidator;
