'use strict';

var debug = require('debug')('domain:structureParser'),
  _ = require('lodash'),
  fs = require('fs'),
  path = require('path');

var validFileTypes = ['js', 'json'];

function isValidFileType(fileName) {
  var index = fileName.lastIndexOf('.');
  if (index < 0) {
    return false;
  }
  var fileType = fileName.substring(index + 1);
  var index = validFileTypes.indexOf(fileType);
  if (index < 0) {
    return false;
  }
  return validFileTypes[index];
}

function loadPaths (dir, callback) {
  dir = path.resolve(dir);
  
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
  root = path.resolve(root);
  var res = [];
  
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

      try {
        var required = require(p);
        if (!required || _.isEmpty(required)) {
          return;
        }
        
        if (_.isArray(required)) {
          _.each(required, function (req) {
            res.push({
              path: p,
              dottiedBase: dottiedBase,
              fileName: fileName,
              value: req,
              fileType: path.extname(p).substring(1)
            });
          });
        } else {
          res.push({
            path: p,
            dottiedBase: dottiedBase,
            fileName: fileName,
            value: required,
            fileType: path.extname(p).substring(1)
          });
        }
      } catch (err) {
        debug(err);
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
    
    var res = pathToJson(dir, paths);
    callback(null, res);
  });
}

module.exports = parse;
