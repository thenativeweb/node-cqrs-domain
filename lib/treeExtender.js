function attachLookupFunctions (tree) {

  tree.getContexts = function () {
    var ctxs = [];
    for (var c in tree) {
      var ctx = tree[c];
      if (ctx instanceof Context) {
        ctxs.push(ctx);
      }
    }
    return ctxs;
  };

  tree.getContext = function (name) {
    var ctx = tree[name];
    if (ctx instanceof Context) {
      return ctx;
    }
    return null;
  };

  function getCommandHandler (ctx, query) {
    var aggr;
    if (query.aggregate) {
      aggr = ctx.getAggregate(query.aggregate);
    } else {
      aggr = ctx.getAggregateForCommand(query.name, query.version);
    }

    if (!aggr) {
      return null;
    }

    return aggr.getCommandHandler(query.name, query.version);
  }

  tree.getCommandHandler = function (query) {
    var ctx;
    if (query.context) {
      ctx = tree.getContext(query.context);
      return getCommandHandler(ctx, query);
    } else {
      for (var c in tree.getContexts()) {
        ctx = tree[c];
        var handler = getCommandHandler(ctx, query);
        if (handler) {
          return handler;
        }
      }
    }
    return null;
  };

  this.defineCommand = function (definition) {
    tree.getContexts().forEach(function (ctx) {
      ctx.defineCommand(definition);

      ctx.getAggregates().forEach(function (aggr) {
        aggr.defineCommand(definition);

        if (aggr.defaultCommandHandler) {
          aggr.defaultCommandHandler.defineCommand(definition);
        }

        aggr.getCommands().forEach(function (cmd) {
          cmd.defineCommand(definition);
        });

        aggr.getEvents().forEach(function (evt) {
          evt.defineCommand(definition);
        });

        aggr.getCommandHandlers().forEach(function (cmdHndl) {
          cmdHndl.defineCommand(definition);
        });

        aggr.getBusinessRules().forEach(function (buRu) {
          buRu.defineCommand(definition);
        });
      });
    });
  };

  this.defineEvent = function (definition) {
    tree.getContexts().forEach(function (ctx) {
      ctx.defineEvent(definition);

      ctx.getAggregates().forEach(function (aggr) {
        aggr.defineEvent(definition);

        if (aggr.defaultCommandHandler) {
          aggr.defaultCommandHandler.defineEvent(definition);
        }

        aggr.getCommands().forEach(function (cmd) {
          cmd.defineEvent(definition);
        });

        aggr.getEvents().forEach(function (evt) {
          evt.defineEvent(definition);
        });

        aggr.getCommandHandlers().forEach(function (cmdHndl) {
          cmdHndl.defineEvent(definition);
        });

        aggr.getBusinessRules().forEach(function (buRu) {
          buRu.defineEvent(definition);
        });
      });
    });
  };

  return tree;
}

module.exports = attachLookupFunctions;
