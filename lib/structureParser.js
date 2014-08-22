'use strict';

var debug = require('debug')('domain:structureParser'),
  fs = require('fs'),
  path = require('path'),
  dotty = require('dotty');

var validFileTypes = ['js', 'json'];

function isValidFileType(fileName) {
  var index = fileName.lastIndexOf('.');
  if (index < 0) {
    return false;
  }
  var fileType = fileName.substring(index + 1);
  return validFileTypes.indexOf(fileType) > -1;
}

function loadPaths (dir, callback) {
  var results = [];
  fs.readdir(dir, function (err, list) {
    if (err) {
      debug(err);
      return callback(err);
    }
    
    var pending = list.length;
    
    if (pending === 0) return callback(null, results);
    
    list.forEach(function (file) {
      var pathFull = path.join(dir, file);
      fs.stat(pathFull, function(err, stat) {
        if (err) {
          return debug(err);
        }
        
        // if directory, go deep...
        if (stat && stat.isDirectory()) {
          loadPaths(pathFull, function (err, res) {
            results = results.concat(res);
            if (!--pending) callback(null, results);
          });
          return;
        }
        
        // if a file we are looking for
        if (isValidFileType(pathFull)) {
          results.push(pathFull);
        }
        
        // of just an other file, skip...
        if (!--pending) callback(null, results);
      });
    });
  });
}

function pathToJson (root, paths) {
  var res = {};
  
  paths.forEach(function (p) {
    if (p.indexOf(root) >= 0) {
      var part = p.substring(root.length);
      if (part.indexOf(path.sep) === 0) {
        part = part.substring(path.sep.length);
      }
       
      var splits = part.split(path.sep);
      var withoutFileName = splits;
      withoutFileName.splice(splits.length - 1);
      var fileName = path.basename(part);
      
      var dottiedBase = '';
      withoutFileName.forEach(function (s, i) {
        if (i + 1 < withoutFileName.length) {
          dottiedBase += s + '.';
        } else {
          dottiedBase += s;
        }
      });
      
      if (dottiedBase !== '') {
        var value = dotty.get(res, dottiedBase) || {};
        value[fileName] = p;
        dotty.put(res, dottiedBase, value);
      } else {
        res[fileName] = p;
      }
    } else {
      debug('path is not a subpath from root');
    }
  });
  
  return res;
}

function parse (dir, callback) {
  dir = path.resolve(dir);
  loadPaths(dir, function (err, paths) {
    if (err) {
      return callback(err);
    }
    var json = pathToJson(dir, paths);
    callback(null, json);
  });
}

module.exports = parse;
