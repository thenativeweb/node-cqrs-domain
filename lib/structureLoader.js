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
  
  return item.value === 'contextContent';
}

function isAggregate (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value === 'aggregateContent';
}

function isCommand (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value === 'commandContent';
}

function defineNameOfSchema (item) {
  var name = item.value.title;
  if (!name) {
    var splits = item.dottiedBase.split('.');
    name = splits[splits.length - 1];
  }
  item.name = name;
}

function defineName (item, invert) {
  var name = item.value.name;
  
  function defineNameByDir () {
    if (!name) {
      var splits = item.dottiedBase.split('.');
      name = splits[splits.length - 1];
    }
  }

  function defineNameByFileName () {
    if (!name) {
      name = item.fileName.substring(0, item.fileName.lastIndexOf('.'));
    }
  }
  
  if (invert) {
    defineNameByFileName();
    defineNameByDir();
  } else {
    defineNameByDir();
    defineNameByFileName();
  }
  
  item.name = name;
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
      defineNameOfSchema(item);
      res.schemas.push(item);
      return;
    }
    
    if (isContext(item)) {
      defineName(item);
      res.contexts.push(item);
      return;
    }

    if (isAggregate(item)) {
      defineName(item);
      res.aggregates.push(item);
      return;
    }

    if (isCommand(item)) {
      defineName(item, true);
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

function reorderAggregates (obj, ordered) {
  obj.aggregates.forEach(function (aggItem) {
    var foundCtx = _.find(obj.contexts, function (ctx) {
      return aggItem.dottiedBase.indexOf(ctx.dottiedBase) === 0;
    });

    var ctxName = '_general';
    if (foundCtx) {
      ctxName = foundCtx.name;
      ordered[ctxName] = ordered[ctxName] || { value: foundCtx.value, aggregates: {} };
    } else {
      ordered[ctxName] = ordered[ctxName] || { aggregates: {} };
    }
    ordered[ctxName].aggregates[aggItem.name] = { value: aggItem.value };
    
    // mark context for aggregate
    aggItem.context = ctxName;
  });
}

function reorderCommands (obj, ordered) {
  obj.commands.forEach(function (cmdItem) {
    var foundAggr = _.find(obj.aggregates, function (aggr) {
      return cmdItem.dottiedBase.indexOf(aggr.dottiedBase) === 0;
    });
    
    if (!foundAggr) {
      return;
    }

    ordered[foundAggr.context].aggregates[foundAggr.name].commands = ordered[foundAggr.context].aggregates[foundAggr.name].commands || [];
    ordered[foundAggr.context].aggregates[foundAggr.name].commands.push({
      name: cmdItem.name,
      value: cmdItem.value
    });
    
    // mark context and aggregate for command
    cmdItem.context = foundAggr.context;
    cmdItem.aggregate = foundAggr.name;
  });
}

function reorderValidationRules (obj, ordered) {
  obj.schemas.forEach(function (schemaItem) {
    // define context and aggregate
    var foundCtx = _.find(obj.contexts, function (ctx) {
      return schemaItem.dottiedBase.indexOf(ctx.dottiedBase) === 0;
    });
    if (foundCtx) {
      schemaItem.context = foundCtx.name;
    }

    var foundAggr = _.find(obj.aggregates, function (aggr) {
      return schemaItem.dottiedBase.indexOf(aggr.dottiedBase) === 0;
    });
    if (foundAggr) {
      schemaItem.aggregate = foundAggr.name;
    }
    
    if (!schemaItem.context) {
      // is a general schema!!!!
      ordered.schema = { name: schemaItem.name, value: schemaItem.value };
      return;
    }

    if (!schemaItem.aggregate) {
      // is a context schema!!!!
      ordered[schemaItem.context].schema = { name: schemaItem.name, value: schemaItem.value };
      return;
    }
    
    // check for all commands, if nothing found continue...
    obj.commands.forEach(function (cmdItem) {
      if (cmdItem.name === schemaItem.name &&
        cmdItem.aggregate === schemaItem.aggregate &&
        cmdItem.context === schemaItem.context) {
        var commands = ordered[schemaItem.context].aggregates[schemaItem.aggregate].commands;
        commands.forEach(function (cmd) {
          if (cmd.name === schemaItem.name) {
            cmd.schema = schemaItem.value;
          }
        });
      }
    });
  });
}

function reorder (obj) {
  var ordered = {};

  reorderAggregates(obj, ordered);

  reorderCommands(obj, ordered);
  
//  reorderEvents(obj, ordered);
//
//  reorderBusinessRules(obj, ordered);
//  
//  reorderCommandHandlers(obj, ordered);

  reorderValidationRules(obj, ordered);
  
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
  console.log(JSON.stringify(res, null, 4));
});



