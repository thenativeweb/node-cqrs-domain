var path = require('path')
  , existsSync = require('fs').existsSync || require('path').existsSync
  , utils = require('../utils')
  , sagaLoader;

module.exports = sagaLoader = {

    load: function(p, callback) {

        var sagas = {};

        if (!existsSync(p)){
            return callback(null, sagas);
        }

        utils.path.dive(p, function(err, file) {
            var saga = require(file);
            var name = path.basename(file, '.js');

            sagas[name] = saga;
        }, function() {
            callback(null, sagas);
        });
    }
};