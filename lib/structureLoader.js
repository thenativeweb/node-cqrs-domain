'use strict';

var debug = require('debug')('domain:structureLoader'),
  path = require('path'),
  _ = require('lodash'),
  structureParser = require('./structureParser');

function isSchema (item) {
  return item.fileType === 'json' && item.value.title;
}

function isContext (item) {
  if (item.fileType !== 'js') {
    return false;
  }
  
  return item.value.type === 'context';
}

function isAggregate (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value.type === 'aggregate';
}

function isCommand (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value.type === 'command';
}

function isEvent (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value.type === 'event';
}

function isBusinessRule (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value.type === 'businessRule';
}

function isCommandHandler (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value.type === 'commandHandler';
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
    commands: [],
    events: [],
    businessRules: [],
    commandHandlers: []
  };
  
  items.forEach(function (item) {
    if (isSchema(item)) {
      debug('found schema at: ' + item.path);
      defineNameOfSchema(item);
      res.schemas.push(item);
      return;
    }
    
    if (isContext(item)) {
      debug('found context at: ' + item.path);
      defineName(item);
      res.contexts.push(item);
      return;
    }

    if (isAggregate(item)) {
      debug('found aggregate at: ' + item.path);
      defineName(item);
      res.aggregates.push(item);
      return;
    }

    if (isCommand(item)) {
      debug('found command at: ' + item.path);
      defineName(item, true);
      res.commands.push(item);
      return;
    }

    if (isEvent(item)) {
      debug('found event at: ' + item.path);
      defineName(item, true);
      res.events.push(item);
      return;
    }

    if (isBusinessRule(item)) {
      debug('found businessRule at: ' + item.path);
      defineName(item, true);
      res.businessRules.push(item);
      return;
    }

    if (isCommandHandler(item)) {
      debug('found commandHandler at: ' + item.path);
      defineName(item, true);
      res.commandHandlers.push(item);
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

function reorderDefault (obj, ordered, what) {
  obj[what].forEach(function (objItem) {
    var foundAggr = _.find(obj.aggregates, function (aggr) {
      return objItem.dottiedBase.indexOf(aggr.dottiedBase) === 0;
    });

    if (!foundAggr) {
      return;
    }

    ordered[foundAggr.context].aggregates[foundAggr.name][what] = ordered[foundAggr.context].aggregates[foundAggr.name][what] || [];
    ordered[foundAggr.context].aggregates[foundAggr.name][what].push({
      name: objItem.name,
      value: objItem.value
    });

    // mark context and aggregate
    objItem.context = foundAggr.context;
    objItem.aggregate = foundAggr.name;
  });
}

function reorderCommands (obj, ordered) {
  reorderDefault(obj, ordered, 'commands');
}

function reorderEvents (obj, ordered) {
  reorderDefault(obj, ordered, 'events');
}

function reorderBusinessRules (obj, ordered) {
  reorderDefault(obj, ordered, 'businessRules');
}

function reorderCommandHandlers (obj, ordered) {
  reorderDefault(obj, ordered, 'commandHandlers');
}

function reorderValidationRules (obj, ordered) {
  obj.schemas.forEach(function (schemaItem) {

    var foundCtx = _.find(obj.contexts, function (ctx) {
      return schemaItem.dottiedBase.indexOf(ctx.dottiedBase) === 0;
    });
    if (foundCtx) {
      schemaItem.context = foundCtx.name;
    } else {
      schemaItem.context = '_general';
    }

    var foundAggr = _.find(obj.aggregates, function (aggr) {
      return schemaItem.dottiedBase.indexOf(aggr.dottiedBase) === 0;
    });
    if (foundAggr) {
      schemaItem.aggregate = foundAggr.name;
    }
    
    if (!schemaItem.context || (schemaItem.context === '_general' && schemaItem.dottiedBase === '')) {
      // it's a general schema
      ordered.schema = { name: schemaItem.name, value: schemaItem.value };
      return;
    }

    if (foundCtx && foundCtx.dottiedBase === schemaItem.dottiedBase) {
      // it's a context schema
      ordered[schemaItem.context].schema = { name: schemaItem.name, value: schemaItem.value };
      return;
    }

    if (!schemaItem.aggregate) {
      debug('no aggregate found for schema: ' + schemaItem.path);
      // skip
      return;
    }

    if (foundAggr.dottiedBase === schemaItem.dottiedBase) {
      // it's an aggregate schema
      ordered[schemaItem.context].aggregates[schemaItem.aggregate].schema = { name: schemaItem.name, value: schemaItem.value };
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
            // it's a command schema
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
  
  reorderEvents(obj, ordered);

  reorderBusinessRules(obj, ordered);
  
  reorderCommandHandlers(obj, ordered);

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
