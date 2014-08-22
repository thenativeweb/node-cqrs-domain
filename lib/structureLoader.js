'use strict';

var debug = require('debug')('domain:structureLoader'),
  path = require('path'),
  _ = require('lodash'),
  dotty = require('dotty'),
  structureParser = require('./structureParser');

function isSchema (item) {
  return item.type === 'json' && item.value.title;
}

function scan (items) {
  items.forEach(function (item) {
    if (isSchema(item)) {
      
    }
  });
}

function load (dir, callback) {
  structureParser(dir, function (err, res) {
    if (err) {
      return callback(err);
    }
    
    scan(res);
    
    callback(null, res);
  });
}

module.exports = load;

load(__dirname + '/../synopsis', function (err, res) {
  console.log(res);
});



