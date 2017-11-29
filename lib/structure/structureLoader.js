'use strict';

var debug = require('debug')('domain:structureLoader'),
  _ = require('lodash'),
  path = require('path'),
  structureParser = require('./structureParser'),
  Context = require('./../definitions/context'),
  Aggregate = require('./../definitions/aggregate'),
  Command = require('./../definitions/command'),
  Event = require('./../definitions/event'),
  BusinessRule = require('./../definitions/businessRule'),
  PreCondition = require('./../definitions/preCondition'),
  PreLoadCondition = require('./../definitions/preLoadCondition'),
  CommandHandler = require('./../definitions/commandHandler');

function isSchema (item) {
  return item.fileType === 'json' && item.value.title;
}

function isContext (item) {
  if (item.fileType === 'json') {
    return false;
  }

  return item.value instanceof Context;
}

function isAggregate (item) {
  if (item.fileType === 'json') {
    return false;
  }

  return item.value instanceof Aggregate;
}

function isCommand (item) {
  if (item.fileType === 'json') {
    return false;
  }

  return item.value instanceof Command;
}

function isEvent (item) {
  if (item.fileType === 'json') {
    return false;
  }

  return item.value instanceof Event;
}

function isPreCondition (item) {
  if (item.fileType === 'json') {
    return false;
  }

  return item.value instanceof PreCondition;
}

function isPreLoadCondition (item) {
  if (item.fileType === 'json') {
    return false;
  }

  return item.value instanceof PreLoadCondition;
}

function isBusinessRule (item) {
  if (item.fileType === 'json') {
    return false;
  }

  return item.value instanceof BusinessRule;
}

function isCommandHandler (item) {
  if (item.fileType === 'json') {
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

  if (name === '') {
    item.name = name;
    return;
  }

  function defineNameByDir () {
    if (!name) {
      var splits = item.dottiedBase.split('.');
      name = splits[splits.length - 1];
    }

    if (!name) {
      var tmp = item.path.substring(0, item.path.lastIndexOf(path.sep + item.fileName));
      name = tmp.substring(tmp.lastIndexOf(path.sep) + 1);
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
    preConditions: [],
    preLoadConditions: [],
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
      item.value.name = item.name;
      res.contexts.push(item);
      return;
    }

    if (isAggregate(item)) {
      debug('found aggregate at: ' + item.path);
      defineName(item, true);
      item.value.name = item.name;
      res.aggregates.push(item);
      return;
    }

    if (isCommand(item)) {
      debug('found command at: ' + item.path);
      defineName(item);
      item.value.name = item.name;
      res.commands.push(item);
      return;
    }

    if (isEvent(item)) {
      debug('found event at: ' + item.path);
      defineName(item);
      item.value.name = item.name;
      res.events.push(item);
      return;
    }

    if (isBusinessRule(item)) {
      debug('found businessRule at: ' + item.path);
      defineName(item);
      item.value.name = item.name;
      res.businessRules.push(item);
      return;
    }



    if (isPreCondition(item)) {
      debug('found preCondition at: ' + item.path);
      defineName(item);
      if (!_.isArray(item.name)) {
        item.name = [item.name];
      }
      item.value.name = item.name;
      res.preConditions.push(item);
      return;
    }

    if (isCommandHandler(item)) {
      debug('found commandHandler at: ' + item.path);
      defineName(item);
      item.value.name = item.name;
      res.commandHandlers.push(item);
      return;
    }

    if (isPreLoadCondition(item)) {
      debug('found preLoadCondition at: ' + item.path);
      defineName(item);
      if (!_.isArray(item.name)) {
        item.name = [item.name];
      }
      item.value.name = item.name;
      res.preLoadConditions.push(item);
      return;
    }
  });



  return res;
}

function analyze (dir, useLoaderExtensions, callback) {
  structureParser(dir, useLoaderExtensions, function (items) {
    return _.filter(items, function (i) {
      return isSchema(i) || isContext(i) || isAggregate(i) || isCommand(i) || isEvent(i) || isBusinessRule(i) || isPreCondition(i) || isPreLoadCondition(i) || isCommandHandler(i);
    });
  }, function (err, items, warns) {
    if (err) {
      return callback(err);
    }

    var res = scan(items);

    callback(null, res, warns);
  });
}

function reorderAggregates (obj, ordered) {
  var generalContext = new Context({ name: '_general' });

  obj.aggregates.forEach(function (aggItem) {
    var foundCtx = _.find(obj.contexts, function (ctx) {
      if (aggItem.dottiedBase.indexOf('.') >= 0) {
        return aggItem.dottiedBase.indexOf(ctx.dottiedBase + '.') === 0;
      } else {
        return aggItem.dottiedBase === ctx.dottiedBase;
      }
    });

    if (!foundCtx) {
      foundCtx = _.find(obj.contexts, function (ctx) {
        return ctx.dottiedBase === '';
      });
    }

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
      if (objItem.dottiedBase.indexOf('.') >= 0) {
        return objItem.dottiedBase.indexOf(aggr.dottiedBase + '.') === 0;
      } else {
        return objItem.dottiedBase === aggr.dottiedBase;
      }
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

function preorderPreConditions (obj, ordered) {
  obj.preConditions.forEach(function (objItem) {
    var foundAggr = _.find(obj.aggregates, function (aggr) {
      if (objItem.dottiedBase.indexOf('.') >= 0) {
        return objItem.dottiedBase.indexOf(aggr.dottiedBase + '.') === 0;
      } else {
        return objItem.dottiedBase === aggr.dottiedBase;
      }
    });

    if (!foundAggr) {
      return;
    }

    // mark context and aggregate
    objItem.context = foundAggr.context;
    objItem.aggregate = foundAggr.name;
  });
}

function reorderPreConditions (obj, ordered) {
  preorderPreConditions(obj, ordered);

  obj.preConditions.forEach(function (pc) {

    var foundCmds = _.filter(obj.commands, function (cmd) {
      return pc.context === cmd.context &&
             pc.aggregate === cmd.aggregate &&
            (pc.name.indexOf(cmd.name) >= 0 || pc.name.indexOf('') >= 0) &&
            (pc.name.indexOf('') >= 0 || pc.version === cmd.version);
    });

    if (!foundCmds || foundCmds.length === 0) {
      if (pc.name.length > 0) {
        debug('no cmd found for ',  pc.name);
        return;
      }
      return;
    }

    foundCmds.forEach(function (foundCmd) {
      foundCmd.value.addPreCondition(pc.value);
    });
  });
}

function preorderPreLoadConditions (obj, ordered) {
  obj.preLoadConditions.forEach(function (objItem) {
    var foundAggr = _.find(obj.aggregates, function (aggr) {
      if (objItem.dottiedBase.indexOf('.') >= 0) {
        return objItem.dottiedBase.indexOf(aggr.dottiedBase + '.') === 0;
      } else {
        return objItem.dottiedBase === aggr.dottiedBase;
      }
    });

    if (!foundAggr) {
      return;
    }

    // mark context and aggregate
    objItem.context = foundAggr.context;
    objItem.aggregate = foundAggr.name;
  });
}

function reorderPreLoadConditions (obj, ordered) {
  preorderPreLoadConditions(obj, ordered);

  obj.preLoadConditions.forEach(function (plc) {

    var foundCmds = _.filter(obj.commands, function (cmd) {
      return plc.context === cmd.context &&
        plc.aggregate === cmd.aggregate &&
        (plc.name.indexOf(cmd.name) >= 0 || plc.name.indexOf('') >= 0) &&
        (plc.name.indexOf('') >= 0 || plc.version === cmd.version);
    });

    if (!foundCmds || foundCmds.length === 0) {
      if (plc.name.length > 0) {
        debug('no cmd found for ',  plc.name);
        return;
      }
      return;
    }

    foundCmds.forEach(function (foundCmd) {
      foundCmd.value.addPreLoadCondition(plc.value);
    });
  });
}

function reorderValidationRules (obj, ordered, validatorExtension) {
  var allSchemas = {};
  var cmdSchemas = [];

  obj.schemas.forEach(function (schemaItem) {

    allSchemas['/' + schemaItem.name] = schemaItem.value;

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

    if (!schemaItem.context || (schemaItem.context === '_general' && schemaItem.dottiedBase === '' && !schemaItem.aggregate)) {
      // it's a general schema
      return;
    }

    if (foundCtx && foundCtx.dottiedBase === schemaItem.dottiedBase && schemaItem.context !== '_general') {
      // it's a context schema
      return;
    }

    if (!schemaItem.aggregate) {
      debug('no aggregate found for schema: ' + schemaItem.path);
      // skip
      return;
    }

    if (foundAggr.dottiedBase === schemaItem.dottiedBase) {
      var foundPossibleCommand = _.find(foundAggr.value.commands, 'name', schemaItem.value.title);
      if (!foundPossibleCommand) {
        // it's an aggregate schema
        return;
      }
    }

    cmdSchemas.push(schemaItem);
  });

  var formats = {};

  var getValidatorFn = require('./../validator');

  var validator = {
    addFormat: function (key, value) {
      if (!key) {
        var err = new Error('Please pass valid arguments!');
        debug(err);
        throw err;
      }

      if (!value) {
        _.forOwn(key, function (v, k) {
          formats[k] = v;
        });
      } else {
        formats[key] = value;
      }
    },
    addSchema: function (key, value) {
      if (!key) {
        var err = new Error('Please pass valid arguments!');
        debug(err);
        throw err;
      }

      if (!value) {
        _.forOwn(key, function (v, k) {
          allSchemas[k] = v;
        });
      } else {
        allSchemas[key] = value;
      }
    },
    validator: function (fn) {
      if (!fn || !_.isFunction(fn)) {
        var err = new Error('Please pass a valid function!');
        debug(err);
        throw err;
      }

      getValidatorFn = fn;
    }
  };

  validatorExtension(validator);

  cmdSchemas.forEach(function (schemaItem) {
    // check for all commands, if nothing found continue...
    obj.commands.forEach(function (cmdItem) {
      if (cmdItem.name === schemaItem.name &&
        cmdItem.aggregate === schemaItem.aggregate &&
        cmdItem.context === schemaItem.context &&
        ((schemaItem.value.version === undefined || schemaItem.value.version === null) || cmdItem.value.version === schemaItem.value.version)) {
        var cmd = ordered[schemaItem.context].getAggregate(schemaItem.aggregate).getCommand(schemaItem.name, schemaItem.value.version);
        // it's a command schema
        cmd.defineValidation(getValidatorFn({ schemas: allSchemas, formats: formats }, schemaItem.value));
      }
    });
  });
}

function reorder (obj, validatorExtension) {
  var ordered = {};

  reorderAggregates(obj, ordered);

  reorderCommands(obj, ordered);

  reorderEvents(obj, ordered);

  reorderBusinessRules(obj, ordered);

  reorderCommandHandlers(obj, ordered);

  reorderValidationRules(obj, ordered, validatorExtension);

  reorderPreLoadConditions(obj, ordered);

  reorderPreConditions(obj, ordered);

  if (!ordered || _.isEmpty(ordered)) {
    debug('analyzed: ', obj);
    debug('ordered: ', ordered);
  }

  return ordered;
}

function load (dir, validatorExtension, useLoaderExtensions, callback) {
  analyze(dir, useLoaderExtensions, function (err, dividedByTypes, warns) {
    if (err) {
      return callback(err);
    }

    var structured = reorder(dividedByTypes, validatorExtension);

    callback(err, structured, warns);
  });
}

module.exports = load;
