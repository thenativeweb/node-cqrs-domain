var async = require('async'),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    commandHandlerLoader = require('./loaders/commandHandlerLoader'),
    aggregateLoader = require('./loaders/aggregateLoader'),
    sagaHandlerLoader = require('./loaders/sagaHandlerLoader'),
    sagaLoader = require('./loaders/sagaLoader'),
    commandDispatcher = require('./commandDispatcher'),
    eventStore = require('eventstore'),
    _ = require('lodash'),
    queue = require('node-queue'),
    eventEmitter = require('./eventEmitter'),
    repository = require('viewmodel').write.create(),
    commandLock = require('viewmodel').write.create(),
    nodeEventedCommand = require('nodeEventedCommand'),
    hub = nodeEventedCommand.hub.create(),
    Command = nodeEventedCommand.Command.create(hub),
    domain,
    commandBuffer = [];

function createCommandRejectedEvent(cmd, reason) {
  return {
    event: 'commandRejected',
    id: cmd.id + '_reject',
    commandId: cmd.id,
    payload: {
      command: cmd,
      reason: reason
    },
    head: cmd.head
  };
}

function publish(msg) {
  eventEmitter.emit('event:' + msg.event, msg);
  hub.emit('event:' + msg.event, msg);
  domain.emit('event', msg);
}

// pass commands to bus
hub.on('commands', function(data) {
  eventEmitter.emit('command:' + data.command, data);
});

function getCommandId(evt) {
  return evt.commandId;
}

module.exports = domain = _.extend(new EventEmitter2({
    wildcard: true,
    delimiter: ':',
    maxListeners: 1000 // default would be 10!
  }), {

  initialize: function(options, newGetCommandId, callback) {

    if (arguments.length === 1) {
      callback = options;
    } else if (arguments.length === 2) {
      callback = newGetCommandId;
      newGetCommandId = null;
    }

    var defaults = {
      commandQueue: { type: 'inMemory', collectionName: 'commands' },
      eventStore: { type: 'inMemory' },
      repository: { type: 'inMemory', collectionName: 'sagas' },
      // commandLock: { type: 'inMemory', collectionName: 'commandlock' },
      forcedQueuing: false,
      disableQueuing: false,
      handleUndispatchedEvents: true,
      retryOnConcurrencyTimeout: 800,
      snapshotThreshold: 10
    };

    _.defaults(options, defaults);

    options.commandQueue.collectionName = options.commandQueue.collectionName || defaults.commandQueue.collectionName;
    options.repository.collectionName = options.repository.collectionName || defaults.repository.collectionName;

    if (options.commandLock) {
      options.commandLock.collectionName = options.commandLock.collectionName || 'commandlock';
    }

    // initialize the hub by passing the function that gets the command id from the event
    hub.init(newGetCommandId || getCommandId);

    var es = eventStore.createStore({ enableDispatching: false });
    es.configure(function() {
      if (options.eventStore.type !== 'inMemory') {
        var storeModule;
        try {
          storeModule = require('eventstore.' + options.eventStore.type);
        } catch (e) {
          storeModule = require('eventstore.' + options.eventStore.type.toLowerCase());
        }
        this.use(storeModule.createStorage(options.eventStore));
      }
    }).start(function(err) {

      if (err && callback) {
        return callback(err);
      }

      if (options.handleUndispatchedEvents) {
        es.getUndispatchedEvents(function(err, evts) {
          if (evts && evts.length > 0) {
            _.each(evts, function(evt) {
              publish(evt.payload);
              es.setEventToDispatched(evt, function(err) {});
            });
          }
        });
      }

      eventEmitter.on('commandRejected', function(cmd, reason) {
        publish(createCommandRejectedEvent(cmd, reason));
      });

      eventEmitter.on('command:*', function(cmd) {
        if (!cmd.id) {
          es.getNewIdFromStorage(function(err, id) {
            cmd.id = id;
            domain.handle(cmd);
          });
        } else {
          domain.handle(cmd);
        }
      });

      async.parallel({
        aggregates: function(callback) {
          aggregateLoader.load(options.aggregatesPath, callback);
        },
        commandHandlers: function(callback) {
          if (options.commandLock) {
            commandLock.init(options.commandLock, function() {
              commandHandlerLoader.configure(function() {
                this.use(es);
                this.use({ publish: publish });
                this.use(commandLock);
              });
              commandHandlerLoader.load(options.commandHandlersPath, options, callback);
            });
          } else {
            commandHandlerLoader.configure(function() {
              this.use(es);
              this.use({ publish: publish });
            });
            commandHandlerLoader.load(options.commandHandlersPath, options, callback);
          }
        },

        sagas: function(callback) {
          sagaLoader.load(options.sagasPath, callback);
        },
        sagaHandlers: function(callback) {
          async.series([
            function(callback) {
              repository.init(options.repository, callback);
            },
            function(callback) {
              sagaHandlerLoader.configure(function() {
                this.use(repository);
              });
              callback(null);
            }
          ], function(err) {
            sagaHandlerLoader.load(options.sagaHandlersPath, callback);
          });
        }
      }, function(err, results) {

        var aggregates = results.aggregates,
            commandHandlers = results.commandHandlers;

        for(var i = 0, len = commandHandlers.length; i < len; i++) {
          var commandHandler = commandHandlers[i];
          commandHandler.Aggregate = aggregates[commandHandler.aggregate];
          commandHandler.Command = Command;
        }

        var sagas = results.sagas,
            sagaHandlers = results.sagaHandlers;

        async.forEach(sagaHandlers, function(sagaHandler, callback) {
          sagaHandler.Saga = sagas[sagaHandler.saga];
          sagaHandler.initialize(callback);
        }, function(err) {

          function initCommandDispatcher() {
            var worker = {};

            // starts the worker by using an interval loop
            worker.start = function() {
              worker.process = setInterval(function() {

                // if the last loop is still in progress leave this loop
                if (worker.isRunning)
                    return;

                worker.isRunning = true;

                (function next(e) {

                  // dipatch one command in queue and call the _next_ callback, which 
                  // will call _process_ for the next command in queue.
                  var process = function(cmdPointer, next) {

                    // Publish it now...
                    commandDispatcher.dispatch(cmdPointer.command, function(err) {
                      if (cmdPointer.callback) cmdPointer.callback(null);
                      next();
                    });
                  };

                  // serial _process_ all events in queue
                  if (!e && commandBuffer.length) {
                    process(commandBuffer.shift(), next);
                  }
                })();

                worker.isRunning = false;

              }, 10);
            };

            // fire things off
            worker.start();

            commandDispatcher.initialize({ forcedQueuing: options.forcedQueuing}, callback);
          }

          if (options.disableQueuing) {
            initCommandDispatcher();
          } else {
            queue.createQueue(options.commandQueue, function(err, commandQueue) {
              commandDispatcher.configure(function() {
                this.use(commandQueue);
              });
              initCommandDispatcher();
            });
          }
        });

      });

    });

  },

  handle: function(cmd, callback) {

    commandBuffer.push({ command: cmd, callback: callback });

  }

});