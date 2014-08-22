'use strict';

var debug = require('debug')('domain:structureLoader'),
  path = require('path'),
  _ = require('lodash'),
  dotty = require('dotty'),
  structureParser = require('./structureParser');

function requireJs (p) {
  
}

function requireSchema (p) {
  var json = require(p);
  if (json.title) {
    debug('schema with title "' + json.title + '" found');
    return json;
  }
  return null;
}

function load (dir, callback) {
  var res = {};
  
  structureParser(dir, function (err, jsFilesPaths, jsonFilesPaths) {
    if (err) {
      return callback(err);
    }

    try {
//    var jsFiles = [];
//    for (var jsi in jsFilesPaths) {
//      var obj = require(jsi);
//      if (obj) {
//        jsFiles.push({
//          path: jsi,
//          dottyPath: jsFilesPaths[jsi],
//          js: obj
//        });
//      }
//    }
//    console.log(jsFiles);


      var schemaFiles = [];
      for (var jsoni in jsonFilesPaths) {
        var schema = require(jsoni);
        if (schema && schema.title) {
          schemaFiles.push({
            path: jsoni,
            dottyPath: jsonFilesPaths[jsoni],
            schema: schema
          });
        }
      }
      console.log(schemaFiles);


      callback(null, res);
    } catch (err) {
      callback(err);
    }
  })
}

module.exports = load;

load(__dirname + '/../synopsis', function (err, res) {
  console.log(res);
});



