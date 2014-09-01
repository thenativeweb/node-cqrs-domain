'use strict';

// Grab the util module that's bundled with Node
var util = require('util');

// Create a new custom Error constructor
function ConcurrencyError(msg, more) {
  // Pass the constructor to V8's
  // captureStackTrace to clean up the output
  Error.captureStackTrace(this, ConcurrencyError);

  // If defined, store a custom error message
  if (msg) {
    this.message = msg;
  }
}

// Extend our custom Error from Error
util.inherits(ConcurrencyError, Error);

// Give our custom error a name property. Helpful for logging the error later.
ConcurrencyError.prototype.name = ConcurrencyError.name;

module.exports = ConcurrencyError;
