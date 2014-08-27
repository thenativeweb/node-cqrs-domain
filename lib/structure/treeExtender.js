'use strict';

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

module.exports = function (tree) {

  return {

    getContexts: function () {
      var ctxs = [];
      for (var c in tree) {
        var ctx = tree[c];
        if (ctx instanceof Context) {
          ctxs.push(ctx);
        }
      }
      return ctxs;
    },

    getContext: function (name) {
      var ctx = tree[name];
      if (ctx instanceof Context) {
        return ctx;
      }
      return null;
    },

    getCommandHandler: function (query) {
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
    },

    defineOptions: function (options) {
      tree.getContexts().forEach(function (ctx) {
        ctx.defineOptions(options);

        ctx.getAggregates().forEach(function (aggr) {
          aggr.defineOptions(options);

          if (aggr.defaultCommandHandler) {
            aggr.defaultCommandHandler.defineOptions(options);
          }

          aggr.getCommands().forEach(function (cmd) {
            cmd.defineOptions(options);
          });

          aggr.getEvents().forEach(function (evt) {
            evt.defineOptions(options);
          });

          aggr.getCommandHandlers().forEach(function (cmdHndl) {
            cmdHndl.defineOptions(options);
          });

          aggr.getBusinessRules().forEach(function (buRu) {
            buRu.defineOptions(options);
          });
        });
      });
      return this;
    },

    defineCommand: function (definition) {
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
      return this;
    },

    defineEvent: function (definition) {
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
      return this;
    },
    
    useEventStore: function (eventStore) {
      tree.getContexts().forEach(function (ctx) {
        ctx.getAggregates().forEach(function (aggr) {
          if (aggr.defaultCommandHandler) {
            aggr.defaultCommandHandler.useEventStore(eventStore);
          }
          aggr.getCommandHandlers().forEach(function (cmdHndl) {
            cmdHndl.useEventStore(eventStore);
          });
        });
      });
      return this;
    },

    useAggregateLock: function (aggregateLock) {
      tree.getContexts().forEach(function (ctx) {
        ctx.getAggregates().forEach(function (aggr) {
          if (aggr.defaultCommandHandler) {
            aggr.defaultCommandHandler.useAggregateLock(aggregateLock);
          }
          aggr.getCommandHandlers().forEach(function (cmdHndl) {
            cmdHndl.useAggregateLock(aggregateLock);
          });
        });
      });
      return this;
    },

    idGenerator: function (getNewId) {
      tree.getContexts().forEach(function (ctx) {
        ctx.getAggregates().forEach(function (aggr) {
          aggr.idGenerator(getNewId);
        });
      });
      return this;
    }

  };

};
