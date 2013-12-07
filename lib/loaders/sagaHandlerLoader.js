var eventEmitter = require('../eventEmitter'),
    existsSync = require('fs').existsSync || require('path').existsSync,
    utils = require('../utils'),
    sagaHandlerLoader;

module.exports = sagaHandlerLoader = {
    
  configure: function(fn) {
    fn.call(sagaHandlerLoader);
    return sagaHandlerLoader;
  },

  use: function(module) {
    if (!module) return;

    if (module.commit) {
      sagaHandlerLoader.repository = module;
    }
  },

  load: function(p, callback) {

    var sagaHandlers = [];

    if (!existsSync(p)){
      return callback(null, sagaHandlers);
    }

    utils.path.dive(p, function(err, file) {
      var sagaHandler = require(file);
      sagaHandlers.push(sagaHandler);

      sagaHandler.configure(function() {
        sagaHandler.use(sagaHandlerLoader.repository);
      });

      function action(evt) {
        sagaHandler.handle(evt);
      }

      for(var i = 0, len = sagaHandler.events.length; i < len; i++) {
        var evtName = sagaHandler.events[i];
        eventEmitter.on('event:' + evtName, action);
        eventEmitter.register('event:' + evtName);
      }
    }, function() {
      callback(null, sagaHandlers);
    });
  }
};