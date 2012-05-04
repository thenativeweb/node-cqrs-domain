var path = require('path')
  , async = require('async')
  , utils = require('../utils')
  , _ = require('underscore');

module.exports = {

    load: function(aggregatesPath, validationRulesPath, businessRulesPath, callback) {

        if (arguments.length === 2) {
            callback = validationRulesPath;
            validationRulesPath = aggregatesPath + '/../validationRules';
            businessRulesPath = aggregatesPath + '/../businessRules';
        }

        var aggregates = {};

        if (!path.existsSync(aggregatesPath)){
            return callback(null, aggregates);
        }

        async.parallel( {
            cmdValRules: function(callback) {
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

            businessRules: function(callback) {
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
            }
        },

        function(err, results) {
            if (err) return callback(err);

            utils.path.dive(aggregatesPath, function(err, file) {
                var aggregate = require(file);
                var name = path.basename(file, '.js');

                aggregate.prototype.validationRules = results.cmdValRules[name];
                aggregate.prototype.businessRules = results.businessRules[name];

                aggregates[name] = aggregate;
            }, function() {
                callback(null, aggregates);
            });
        });
    }
};