'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  dotty = require('dotty'),
  async = require('async'),
  debug = require('debug')('domain:command'),
  BusinessRuleError = require('../errors/businessRuleError');

/**
 * Command constructor
 * @param {Object}   meta  Meta infos like: { name: 'name', version: 1, payload: 'some.path' }
 * @param {Function} cmdFn Function handle
 *                         `function(cmd, aggregateModel){}`
 * @constructor
 */
function Command (meta, cmdFn) {
  Definition.call(this, meta);

  meta = meta || {};

  if (!cmdFn || !_.isFunction(cmdFn)) {
    var err = new Error('Command function not injected!');
    debug(err);
    throw err;
  }

  // this.source = meta.source || {};

  this.version = meta.version || 0;
  this.payload = meta.payload === '' ? meta.payload : (meta.payload || null);
  if (meta.existing) {
    this.existing = true;
  } else if (meta.existing === false) {
    this.existing = false;
  } else {
    this.existing = undefined;
  }

  this.cmdFn = cmdFn;

  this.preConditions = [];
  this.preLoadConditions = [];
}

util.inherits(Command, Definition);

_.extend(Command.prototype, {

  /**
   * Inject the aggregate module.
   * @param {Aggregate} aggregate The context module to be injected.
   */
  defineAggregate: function (aggregate) {
    if (!aggregate || !_.isObject(aggregate)) {
      var err = new Error('Please inject a valid aggregate object!');
      debug(err);
      throw err;
    }

    this.aggregate = aggregate;
  },

  /**
   * Injects the pre-condition function.
   * @param {Function} preCond The pre-condition function that should be injected
   */
  addPreCondition: function (preCond) {
    if (!preCond || !_.isObject(preCond)) {
      var err = new Error('Please inject a valid preCondition object!');
      debug(err);
      throw err;
    }

    if (!preCond.payload && preCond.payload !== '') {
      preCond.payload = this.aggregate.defaultPreConditionPayload;
    }

    if (this.preConditions.indexOf(preCond) < 0) {
      preCond.defineAggregate(this.aggregate);
      this.preConditions.push(preCond);
      this.preConditions = _.sortBy(this.preConditions, function(pc) {
        return pc.priority;
      });
    }
  },

  /**
   * Injects the pre-load-condition function.
   * @param {Function} preLoadCond The pre-load-condition function that should be injected
   */
  addPreLoadCondition: function (preLoadCond) {
    if (!preLoadCond || !_.isObject(preLoadCond)) {
      var err = new Error('Please inject a valid preCondition object!');
      debug(err);
      throw err;
    }

    if (!preLoadCond.payload) {
      preLoadCond.payload = this.aggregate.defaultPreLoadConditionPayload;
    }

    if (this.preLoadConditions.indexOf(preLoadCond) < 0) {
      preLoadCond.defineAggregate(this.aggregate);
      this.preLoadConditions.push(preLoadCond);
      this.preLoadConditions = _.sortBy(this.preLoadConditions, function(pc) {
        return pc.priority;
      });
    }
  },

  /**
   * Injects the validator function.
   * @param {Function} validator The validator function that should be injected
   */
  defineValidation: function (validator) {
    if (!_.isFunction(validator)) {
      var err = new Error('Please pass in a function');
      debug(err);
      throw err;
    }
    if (validator.length == 2) {
      return this.validator = validator;
    }

    this.validator = function (data, callback) {
      callback(validator(data));
    };

    return this.validator;
  },

  /**
   * Validates the requested command.
   * @param {Object} cmd The command object
   * @returns {ValidationError}
   */
  validate: function (cmd, callback) {
    if (!this.validator) {
      debug('no validation rule for ' + this.name);
      return callback();
    }
    return this.validator(cmd, callback);
  },

  /**
   * Checks for pre-load conditions
   * @param {Object}         cmd            The command object.
   * @param {Function}       callback       The function, that will be called when this action is completed.
   *                                        `function(err){}`
   */
  checkPreLoadConditions: function (cmd, callback) {
    if (this.preLoadConditions.length === 0) {
      debug('no pre-load-condition for ' + this.name);
      return callback(null);
    }

    var self = this;
    async.eachSeries(this.preLoadConditions, function (preLoadCondition, callback) {
      if (preLoadCondition.version === undefined || preLoadCondition.version === null || preLoadCondition.version === self.version) {
        return preLoadCondition.check(cmd, callback);
      }
      callback(null);
    }, callback);
  },

  /**
   * Checks for pre-conditions
   * @param {Object}         cmd            The command object.
   * @param {AggregateModel} aggregateModel The aggregate object.
   * @param {Function}       callback       The function, that will be called when this action is completed.
   *                                        `function(err){}`
   */
  checkPreConditions: function (cmd, aggregateModel, callback) {
    if (this.existing === true && aggregateModel.get('_revision') === 0) {
      var err = new BusinessRuleError('This command only wants to be handled, if aggregate already existing!', {
        type: 'AggregateNotExisting',
        aggregateId: aggregateModel.id,
        aggregateRevision: aggregateModel.get('_revision')
      });
      debug(err);
      return callback(err);
    }

    if (this.existing === false && aggregateModel.get('_revision') !== 0) {
      var err = new BusinessRuleError('This command only wants to be handled, if aggregate not existing!', {
        type: 'AggregateAlreadyExisting',
        aggregateId: aggregateModel.id,
        aggregateRevision: aggregateModel.get('_revision')
      });
      debug(err);
      return callback(err);
    }

    if (this.preConditions.length === 0) {
      debug('no pre-condition for ' + this.name);
      return callback(null);
    }

    var self = this;
    async.eachSeries(this.preConditions, function (preCondition, callback) {
      if (preCondition.version === undefined || preCondition.version === null || preCondition.version === self.version) {
        return preCondition.check(cmd, aggregateModel, callback);
      }
      callback(null);
    }, callback);
  },

  /**
   * Get infos to load correct stream.
   * @param {Object} cmd The command object.
   * @returns {Array}
   */
  getLoadInfo: function (cmd) {
    var aggregateId = dotty.get(cmd, this.definitions.command.aggregateId);
    var aggregateName = this.aggregate.name;
    var contextName = this.aggregate.context.name;

    var toLoad = [{
      context: contextName,
      aggregate: aggregateName,
      aggregateId: aggregateId
    }];

    if (_.isFunction(this.getStreamsInfo)) {
      toLoad = this.getStreamsInfo(cmd);
      if (!_.isArray(toLoad)) {
        toLoad = [toLoad];
      }
      toLoad.forEach(function (l) {
        l.aggregateId = l.aggregateId || aggregateId;
      });
    }

    if (toLoad[0].context !== contextName || toLoad[0].aggregate !== aggregateName) {
      throw new Error('First stream to load has to be the new one!');
    }

    return toLoad;
  },

  /**
   * Handles the passed command
   * @param {Object}         cmd            The command object.
   * @param {AggregateModel} aggregateModel The aggregate object.
   */
  handle: function (cmd, aggregateModel) {
    if (!this.payload || this.payload === '') {
      this.cmdFn(_.cloneDeep(cmd), aggregateModel);
      return;
    }

    var payload = dotty.get(cmd, this.payload);
    this.cmdFn(_.cloneDeep(payload), aggregateModel);
  },

  /**
   * Defines which event streams should be loaded before handling this event.
   * @param {Function} fn Function containing the algorithm. Should return an array of infos.
   *                      `function(cmd){}`
   */
  defineEventStreamsToLoad: function (fn) {
    if (!_.isFunction(fn)) {
      throw new Error('Please pass in a function');
    }

    this.getStreamsInfo = fn;
    return this;
  }

});

module.exports = Command;
