var path = require('path')
  , fs = require('fs')
  , utils = require('../utils')
  , sagaLoader;

module.exports = sagaLoader = {

    load: function(p, callback) {

        var sagas = {};

        if (!fs.existsSync(p)){
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