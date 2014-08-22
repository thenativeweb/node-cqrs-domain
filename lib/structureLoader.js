'use strict';

var debug = require('debug')('domain:structureLoader'),
  structureLoader = require('./structureLoader');

function load (dir, callback) {
  structureLoader(dir, function (err, res) {
    if (err) {
      return callback(err);
    }
    
    
  })
}

module.exports = load;
