'use strict';

var tolerate = require('tolerance'),
  _ = require('lodash'),
  Base = require('./base');

function getSpecificDbImplementation(options) {
  options = options || {};

  options.type = options.type || 'inmemory';

  if (_.isFunction(options.type)) {
    return options.type;
  }

  options.type = options.type.toLowerCase();

  var dbPath = __dirname + "/databases/" + options.type + ".js";

  var exists = require('fs').existsSync || require('path').existsSync;
  if (!exists(dbPath)) {
    var errMsg = 'Implementation for db "' + options.type + '" does not exist!';
    console.log(errMsg);
    throw new Error(errMsg);
  }

  try {
    var db = require(dbPath);
    return db;
  } catch (err) {

    if (err.message.indexOf('Cannot find module') >= 0 &&
      err.message.indexOf("'") > 0 &&
      err.message.lastIndexOf("'") !== err.message.indexOf("'")) {

      var moduleName = err.message.substring(err.message.indexOf("'") + 1, err.message.lastIndexOf("'"));
      console.log('Please install module "' + moduleName +
        '" to work with db implementation "' + options.type + '"!');
    }

    throw err;
  }
}

module.exports = {
  Lock: Base,

  create: function(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    options = options || {};

    var Lock;

    try {
      Lock = getSpecificDbImplementation(options);
    } catch (err) {
      if (callback) callback(err);
      throw err;
    }

    var lock = new Lock(options);
    if (callback) {
      process.nextTick(function () {
        tolerate(function (callback) {
          lock.connect(callback);
        }, options.timeout || 0, callback || function () {
        });
      });
    }
    return lock;
  }
};
