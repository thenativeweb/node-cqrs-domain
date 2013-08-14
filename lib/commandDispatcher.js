var async = require('async')
  , retry = require('retry')
  , eventEmitter = require('./eventEmitter');

module.exports = {

    configure: function(fn) {
        fn.call(this);
        return this;
    },

    use: function(module) {
        if (!module) return;
    
        if (module.push) {
            this.commandQueue = module;
        }
    },

    initialize: function(options, callback) {
        var self = this;

        if (!callback) {
            callback = options;
            this.options = {};
        } else {
            this.options = options;
        }

        eventEmitter.on('handled:*', function(id, command) {
            self.commandQueue.remove(id, function() {});
        });

        this.reEmitCommands(callback);
    },

    reEmitCommands: function(callback) {
        this.commandQueue.getAll(function(err, cmds) {
            async.forEach(cmds, function(item, cb) {
                eventEmitter.emit('handle:' + item.data.command, item.id, item.data);
                cb();
            }, callback);
        });
    },

    dispatch: function(cmd, callback) {

        var options = this.options
          , commandQueue = this.commandQueue;

        if (!commandQueue) return callback(new Error('No commandQueue provided!'));

        async.waterfall([

            // ĥas no handlers
            function(callback) {
                var handlersCount = eventEmitter.registerCount('handle:' + cmd.command);
                if (handlersCount === 0) {
                    callback(new Error('no handler registered for this command'));
                } else {
                    callback(null);
                }
            },

            // use provided aggregateId or get one from commandQueue
            function(callback){
                if (options.forcedQueuing) {
                    commandQueue.getNewId(function(err, newId) {
                        callback(err, newId);
                    });
                    return;
                }

                if (cmd.payload && cmd.payload.id) {
                    callback(null, cmd.payload.id);
                } else {
                    commandQueue.getNewId(function(err, newId) {
                        callback(err, newId);
                    });
                }
            },

            // check if command can be dispatched
            function(id, callback) {

                if (options.forcedQueuing) {
                    callback(null, id);
                    return;
                }

                var operation = retry.operation({
                    retries: 3,
                    factor: 3,
                    minTimeout: 60,
                    maxTimeout: 1000,
                    randomize: true
                });

                operation.attempt(function(currentAttempt) {
                    commandQueue.isQueued(id, function(err) {
                        if (operation.retry(err)) {
                            return;
                        }

                        if (!err) {
                            callback(null, id);
                        } else {
                            eventEmitter.emit('commandRejected', cmd, 'Another command already queued for this aggregate!');
                            callback(new Error('Another command already queued for this aggregate!'));
                        }
                    });
                });
            },

            // emit command to commandEmitter
            function(id, callback) {
                commandQueue.push(id, cmd, function(err) {
                    if (!err) {
                        eventEmitter.emit('handle:' + cmd.command, id, cmd);
                    } else {
                        eventEmitter.emit('commandRejected', cmd, err.message);
                    }

                    callback(null);
                });
            }
        ],

        // final callback
        function (err) {
           if (callback) callback(err);
        });
    }

};