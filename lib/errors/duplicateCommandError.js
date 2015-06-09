'use strict';

// Grab the util module that's bundled with Node
var util = require('util');

// Create a new custom Error constructor
function DuplicateCommandError(msg, more) {
  // Pass the constructor to V8's
  // captureStackTrace to clean up the output
  Error.captureStackTrace(this, DuplicateCommandError);

  // If defined, store a custom error message
  if (msg) {
    this.message = msg;
  }

  // If defined, store more infos
  if (more) {
    this.more = more;
  }
}

// Extend our custom Error from Error
util.inherits(DuplicateCommandError, Error);

// Give our custom error a name property. Helpful for logging the error later.
DuplicateCommandError.prototype.name = DuplicateCommandError.name;

module.exports = DuplicateCommandError;
