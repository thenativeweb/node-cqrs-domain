var eventEmitter = require('../eventEmitter')
  , path = require('path')
  , utils = require('../utils')
  , commandHandlerLoader;

module.exports = commandHandlerLoader = {
    
    configure: function(fn) {
        fn.call(commandHandlerLoader);
        return commandHandlerLoader;
    }, 

    use: function(module) {
        if (!module) return;
    
        if (module.getFromSnapshot) {
            commandHandlerLoader.eventStore = module;
        }
    }, 

    load: function(p, options, callback) {

        if (!callback) {
            callback = options;
            options = { snapshotThreshold: 10 };
        }

        var commandHandlers = [];

        if (!path.existsSync(p)){
            return callback(null, commandHandlers);
        }

        utils.path.dive(p, function(err, file) {
            var commandHandler = require(file);
            commandHandler.options = options;
            commandHandlers.push(commandHandler);

            commandHandler.configure(function() {
                commandHandler.use(commandHandlerLoader.eventStore);
            });

            function action(id, cmd) { 
                commandHandler.handle(id, cmd); 
            }

            for(var i = 0, len = commandHandler.commands.length; i < len; i++) {
                var cmdName = commandHandler.commands[i];
                eventEmitter.on('handle:' + cmdName, action);
            }
        }, function() {
            callback(null, commandHandlers);
        });
    }
};