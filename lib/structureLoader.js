'use strict';

var debug = require('debug')('domain:structureLoader'),
  path = require('path'),
  _ = require('lodash'),
  dotty = require('dotty'),
  structureParser = require('./structureParser');

function isSchema (item) {
  return item.fileType === 'json' && item.value.title;
}

function isContext (item) {
  if (item.fileType !== 'js') {
    return false;
  }
  
  return item.value === 'context';
}

function isAggregate (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value === 'aggregate';
}

function isCommand (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value === 'command';
}

function scan (items) {
  var res = {
    schemas: [],
    contexts: [],
    aggregates: [],
    commands: []
  };
  
  items.forEach(function (item) {
    if (isSchema(item)) {
      res.schemas.push(item);
      return;
    }
    
    if (isContext(item)) {
      res.contexts.push(item);
      return;
    }

    if (isAggregate(item)) {
      res.aggregates.push(item);
      return;
    }

    if (isCommand(item)) {
      res.commands.push(item);
      return;
    }
  });
  
  return res;
}

function analyze (dir, callback) {
  structureParser(dir, function (err, items) {
    if (err) {
      return callback(err);
    }
    
    var res = scan(items);
    
    callback(null, res);
  });
}

function reorder (obj) {
  var ordered = {};
  
  obj.aggregates.forEach(function (aggItem) {
    var foundCtx = _.find(obj.contexts, function (ctx) {
      return aggItem.dottiedBase.indexOf(ctx.dottiedBase);
    });
    
//    var ctxName = foundCtx ? foundCtx.value.name : '_general';
    var ctxName = foundCtx ? foundCtx.fileName : '_general';
    ordered[ctxName] = ordered[ctxName] || {};
    ordered[ctxName][aggItem.fileName] = aggItem.value;
  });
  
  return ordered;
}

function load (dir, callback) {
  analyze(dir, function (err, dividedByTypes) {
    if (err) {
      return callback(err);
    }

    var structured = reorder(dividedByTypes);
    
    callback(err, structured)
  })
}

module.exports = load;

load(__dirname + '/../synopsis', function (err, res) {
  console.log(res);
});



