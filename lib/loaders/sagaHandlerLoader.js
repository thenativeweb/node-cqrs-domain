var eventEmitter = require('../eventEmitter')
  , path = require('path')
  , utils = require('../utils')
  , sagaHandlerLoader;

module.exports = sagaHandlerLoader = {
    
    configure: function(fn) {
        fn.call(sagaHandlerLoader);
        return sagaHandlerLoader;
    }, 

    use: function(module) {
        if (!module) return;
    
        if (module.getEventStreams) {
            sagaHandlerLoader.eventStore = module;
        }
    }, 

    load: function(p, callback) {

        var sagaHandlers = [];

        if (!path.existsSync(p)){
            return callback(null, sagaHandlers);
        }

        utils.path.dive(p, function(err, file) {
            var sagaHandler = require(file);
            sagaHandlers.push(sagaHandler);

            sagaHandler.configure(function() {
                sagaHandler.use(sagaHandlerLoader.eventStore);
            });

            function action(evt) { 
                sagaHandler.handle(evt); 
            }

            for(var i = 0, len = sagaHandler.events.length; i < len; i++) {
                var evtName = sagaHandler.events[i];
                eventEmitter.on('event:' + evtName, action);
            }
        }, function() {
            callback(null, sagaHandlers);
        });
    }
};