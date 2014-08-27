'use strict';

var debug = require('debug')('domain:structureLoader'),
  path = require('path'),
  _ = require('lodash'),
  tv4Module = require('tv4'),
  structureParser = require('./structureParser'),
  Context = require('./../definitions/context'),
  Aggregate = require('./../definitions/aggregate'),
  Command = require('./../definitions/command'),
  Event = require('./../definitions/event'),
  BusinessRule = require('./../definitions/businessRule'),
  CommandHandler = require('./../definitions/commandHandler'),
  getValidator = require('./../validator'),
  generalContext = new Context({ name: '_general' });

function isSchema (item) {
  return item.fileType === 'json' && item.value.title;
}

function isContext (item) {
  if (item.fileType !== 'js') {
    return false;
  }
  
  return item.value instanceof Context;
}

function isAggregate (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value instanceof Aggregate;
}

function isCommand (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value instanceof Command;
}

function isEvent (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value instanceof Event;
}

function isBusinessRule (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value instanceof BusinessRule;
}

function isCommandHandler (item) {
  if (item.fileType !== 'js') {
    return false;
  }

  return item.value instanceof CommandHandler;
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
    defineNameByDir();
    defineNameByFileName();
  } else {
    defineNameByFileName();
    defineNameByDir();
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
      defineName(item, true);
      res.contexts.push(item);
      return;
    }

    if (isAggregate(item)) {
      debug('found aggregate at: ' + item.path);
      defineName(item, true);
      res.aggregates.push(item);
      return;
    }

    if (isCommand(item)) {
      debug('found command at: ' + item.path);
      defineName(item);
      res.commands.push(item);
      return;
    }

    if (isEvent(item)) {
      debug('found event at: ' + item.path);
      defineName(item);
      res.events.push(item);
      return;
    }

    if (isBusinessRule(item)) {
      debug('found businessRule at: ' + item.path);
      defineName(item);
      res.businessRules.push(item);
      return;
    }

    if (isCommandHandler(item)) {
      debug('found commandHandler at: ' + item.path);
      defineName(item);
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
      ordered[ctxName] = ordered[ctxName] || foundCtx.value;
    } else {
      ordered[ctxName] = ordered[ctxName] || generalContext;
    }
    ordered[ctxName].addAggregate(aggItem.value);
    
    // mark context for aggregate
    aggItem.context = ctxName;
  });
}

function reorderDefault (obj, ordered, what) {
  obj[what + 's'].forEach(function (objItem) {
    var foundAggr = _.find(obj.aggregates, function (aggr) {
      return objItem.dottiedBase.indexOf(aggr.dottiedBase) === 0;
    });

    if (!foundAggr) {
      return;
    }

    var whatCap = what.charAt(0).toUpperCase() + what.slice(1);
    
    var agg = ordered[foundAggr.context].getAggregate(foundAggr.name);

    agg['add' + whatCap].call(agg, objItem.value);

    // mark context and aggregate
    objItem.context = foundAggr.context;
    objItem.aggregate = foundAggr.name;
  });
}

function reorderCommands (obj, ordered) {
  reorderDefault(obj, ordered, 'command');
}

function reorderEvents (obj, ordered) {
  reorderDefault(obj, ordered, 'event');
}

function reorderBusinessRules (obj, ordered) {
  reorderDefault(obj, ordered, 'businessRule');
}

function reorderCommandHandlers (obj, ordered) {
  reorderDefault(obj, ordered, 'commandHandler');
}

function reorderValidationRules (obj, ordered) {
  var tv4 = tv4Module.freshApi();
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
      tv4.addSchema('/' + schemaItem.name, schemaItem.value);
      return;
    }

    if (foundCtx && foundCtx.dottiedBase === schemaItem.dottiedBase) {
      // it's a context schema
      if (schemaItem.context === '_general') {
        tv4.addSchema('/' + schemaItem.name, schemaItem.value);
      } else {
        tv4.addSchema('/' + schemaItem.context + '/' + schemaItem.name, schemaItem.value);
      }
      return;
    }

    if (!schemaItem.aggregate) {
      debug('no aggregate found for schema: ' + schemaItem.path);
      // skip
      return;
    }

    if (foundAggr.dottiedBase === schemaItem.dottiedBase) {
      // it's an aggregate schema
      if (schemaItem.context === '_general') {
        tv4.addSchema('/' + schemaItem.aggregate + '/' + schemaItem.name, schemaItem.value);
      } else {
        tv4.addSchema('/' + schemaItem.context + '_' + schemaItem.aggregate + '/' + schemaItem.name, schemaItem.value);
      }
      return;
    }
    
    // check for all commands, if nothing found continue...
    obj.commands.forEach(function (cmdItem) {
      if (cmdItem.name === schemaItem.name &&
        cmdItem.aggregate === schemaItem.aggregate &&
        cmdItem.context === schemaItem.context) {
        var commands = ordered[schemaItem.context].getAggregate(schemaItem.aggregate).getCommandsByName(schemaItem.name);
        commands.forEach(function (cmd) {
          // it's a command schema
          cmd.defineValidation(getValidator(tv4, schemaItem.value));
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
