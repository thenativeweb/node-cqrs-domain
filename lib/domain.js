var async = require('async')
  , EventEmitter2 = require('eventemitter2').EventEmitter2
  , commandHandlerLoader = require('./loaders/commandHandlerLoader')
  , aggregateLoader = require('./loaders/aggregateLoader')
  , sagaHandlerLoader = require('./loaders/sagaHandlerLoader')
  , sagaLoader = require('./loaders/sagaLoader')
  , commandDispatcher = require('./commandDispatcher')
  , eventStore = require('eventstore')
  , _ = require('underscore')
  , queue = require('node-queue')
  , eventEmitter = require('./eventEmitter')
  , domain;

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
    domain.emit('event', msg);
}

module.exports = domain = _.extend(new EventEmitter2({
        wildcard: true,
        delimiter: ':',
        maxListeners: 1000 // default would be 10!
    }), {

    initialize: function(options, callback) {

        if(_.isFunction(options)) {
            callback = options;
        }

        var defaults = {
            publishingInterval: 200,
            commandQueue: { type: 'inMemory', collectionName: 'commands' },
            eventStore: { type: 'inMemory' }
        };

        _.defaults(options, defaults);

        var es = eventStore.createStore({ publishingInterval: options.publishingInterval });
        es.configure(function() {
            this.use({ publish: publish });
            if (options.eventStore.type !== 'inMemory') {
                this.use(require('eventstore.' + options.eventStore.type).createStorage(options.eventStore));
            }
        }).start();

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
                commandHandlerLoader.configure(function() {
                    this.use(es);
                });
                commandHandlerLoader.load(options.commandHandlersPath, options, callback);
            },

            sagas: function(callback) {
                sagaLoader.load(options.sagasPath, callback);
            },
            sagaHandlers: function(callback) {
                sagaHandlerLoader.configure(function() {
                    this.use(es);
                });
                sagaHandlerLoader.load(options.sagaHandlersPath, callback);
            }
        }, function(err, results) {

            var aggregates = results.aggregates
              , commandHandlers = results.commandHandlers;
              
            for(var i = 0, len = commandHandlers.length; i < len; i++) {
                var commandHandler = commandHandlers[i];
                commandHandler.Aggregate = aggregates[commandHandler.aggregate];
            }

            var sagas = results.sagas
              , sagaHandlers = results.sagaHandlers;

            for(var j = 0, lenj = sagaHandlers.length; j < lenj; j++) {
                var sagaHandler = sagaHandlers[j];
                sagaHandler.Saga = sagas[sagaHandler.saga];
                sagaHandler.initialize();
            }

            queue.connect(options.commandQueue, function(err, commandQueue) {
                commandDispatcher.configure(function() {
                    this.use(commandQueue);
                });
                commandDispatcher.initialize({}, callback);
            });

        });

    },

    handle: function(cmd, callback) {

        commandDispatcher.dispatch(cmd, function(err) {
            if (callback) callback(null);
        });

    }

});