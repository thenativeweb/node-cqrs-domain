var async = require('async')
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

        if (!callback) callback = options;

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

        var commandQueue = this.commandQueue;

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
                commandQueue.isQueued(id, function(err) {
                    if (!err) callback(null, id);
                    else callback(new Error('Another command already queued for this aggregate *so richtig bös*'));
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