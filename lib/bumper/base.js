'use strict';

var util = require('util'),
  EventEmitter = require('events').EventEmitter,
  prequire = require('parent-require'),
  _ = require('lodash'),
  uuid = require('uuid').v4;

/**
 * Bumper constructor
 * @param {Object} options The options can have information like host, port, etc. [optional]
 */
function Bumper(options) {
  options = options || {};

  EventEmitter.call(this);
}

util.inherits(Bumper, EventEmitter);

function implementError (callback) {
  var err = new Error('Please implement this function!');
  if (callback) callback(err);
  throw err;
}

_.extend(Bumper.prototype, {

  /**
   * Initiate communication with the lock.
   * @param  {Function} callback The function, that will be called when this action is completed. [optional]
   *                             `function(err, queue){}`
   */
  connect: implementError,

  /**
   * Terminate communication with the lock.
   * @param  {Function} callback The function, that will be called when this action is completed. [optional]
   *                             `function(err){}`
   */
  disconnect: implementError,

  /**
   * Use this function to obtain a new id.
   * @param  {Function} callback The function, that will be called when this action is completed.
   *                             `function(err, id){}` id is of type String.
   */
  getNewId: function (callback) {
    var id = uuid().toString();
    if (callback) callback(null, id);
  },

  /**
   * Use this function to add a key with expiration.
   * @param  {String}   key      The key
   * @param  {Number}   ttl      The time to live in ms
   * @param  {Function} callback The function, that will be called when this action is completed. [optional]
   *                             `function(err, added){}`
   */
  add: function (key, ttl, callback) {
    implementError(callback);
  },

  /**
   * NEVER USE THIS FUNCTION!!! ONLY FOR TESTS!
   * clears the complete store...
   * @param {Function} callback the function that will be called when this action has finished [optional]
   */
  clear: function (callback) {
    implementError(callback);
  }

});

Bumper.use = function (toRequire) {
  var required;
  try {
    required = require(toRequire);
  } catch (e) {
    // workaround when `npm link`'ed for development
    required = prequire(toRequire);
  }
  return required;
};

module.exports = Bumper;
