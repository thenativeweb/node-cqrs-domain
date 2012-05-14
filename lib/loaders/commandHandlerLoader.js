var eventEmitter = require('../eventEmitter')
  , async = require('async')
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

    load: function(commandHandlersPath, validationRulesPath, options, callback) {

        if (arguments.length === 2) {
            callback = validationRulesPath;
            validationRulesPath = commandHandlersPath + '/../validationRules';
            options = { snapshotThreshold: 10 };
        } else if (arguments.length === 3) {
            callback = options;
            options = validationRulesPath;
            validationRulesPath = commandHandlersPath + '/../validationRules';
        }

        var commandHandlers = [];

        if (!path.existsSync(commandHandlersPath)){
            return callback(null, commandHandlers);
        }

        async.waterfall([
            function(callback) {
                var cmdValRules = {};

                if (path.existsSync(validationRulesPath)) {
                    utils.path.dive(validationRulesPath, function(err, file) {
                        var validation = require(file);
                        var aggrName = validation.aggregate;
                        delete validation.aggregate;
                        cmdValRules[aggrName] = validation;
                    }, function() {
                        callback(null, cmdValRules);
                    });
                } else {
                    callback(null, cmdValRules);
                }
            },

            function(cmdValRules, callback) {
                utils.path.dive(commandHandlersPath, function(err, file) {
                    var commandHandler = require(file);
                    commandHandler.options = options;
                    commandHandlers.push(commandHandler);

                    commandHandler.validationRules = cmdValRules[commandHandler.aggregate];

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
        ],

        function(err) {
            callback(err, commandHandlers);
        });
    }
};