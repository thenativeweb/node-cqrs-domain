'use strict';

var debug = require('debug')('domain:structureLoader'),
  path = require('path'),
  _ = require('lodash'),
  dotty = require('dotty'),
  structureParser = require('./structureParser');

function requireJs (res, p, dottyPath) {
  
}

function requireJson (res, p, dottyPath) {
  var json = require(p);
  if (json.title) {
    debug('schema with title "' + json.title + '" found');
    if (dottyPath === '') {
      res[json.title] = json;
    } else {
      var value = {};
      value[json.title] = json;
      dotty.put(res, dottyPath, value);
    }
  }
}

function load (dir, callback) {
  var res = {};
  
  structureParser(dir, function (err, jsFiles, jsonFiles) {
    if (err) {
      return callback(err);
    }
    
//    var paths = _.keys(items);
//
//    paths.forEach(function (p) {
//      
//      var dottyPath = items[p];
//      
//      if (path.extname(p) === '.js') {
//        return requireJs(res, p, dottyPath);
//      }
//
//      if (path.extname(p) === '.json') {
//        return requireJson(res, p, dottyPath);
//      }   
//      
//    });
    
    callback(null, res);
  })
}

module.exports = load;

load(__dirname + '/../synopsis', function (err, res) {
  console.log(res);
});



