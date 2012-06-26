var path = require('path')
  , fs = require('fs')
  , async = require('async')
  , utils = require('../utils')
  , _ = require('underscore');

module.exports = {

    load: function(aggregatesPath, businessRulesPath, callback) {

        if (arguments.length === 2) {
            callback = businessRulesPath;
            businessRulesPath = aggregatesPath + '/../businessRules';
        }

        var aggregates = {};

        if (!path.existsSync(aggregatesPath)){
            return callback(null, aggregates);
        }

        async.waterfall([
            function(callback) {
                var businessRules = {};

                if (path.existsSync(businessRulesPath)) {
                    utils.path.dive(businessRulesPath, function(err, file) {
                        var businessRule = require(file);

                        function iterator(rule) {
                            businessRules[m].push(rule);
                        }

                        for(var m in businessRule) {
                            businessRules[m] = businessRules[m] || [];
                            if (_.isArray(businessRule[m])) {
                                _.each(businessRule[m], iterator);
                            } else {
                                businessRules[m].push(businessRule[m]);
                            }
                        }
                    }, function() {
                        callback(null, businessRules);
                    });
                } else {
                    callback(null, businessRules);
                }
            },

            function(businessRules, callback) {
                utils.path.dive(aggregatesPath, function(err, file) {
                    var aggregate = require(file);
                    var name = path.basename(file, '.js');

                    aggregate.prototype.businessRules = businessRules[name];

                    aggregates[name] = aggregate;
                }, function() {
                    callback(null, aggregates);
                });
            }
        ],

        function(err) {
            callback(err, aggregates);
        });
    }
};