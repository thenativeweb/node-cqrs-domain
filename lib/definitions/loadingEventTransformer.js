var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('domain:loadingEventTransformer');

/**
 * LoadingEventTransformer constructor
 * @param {Object}   meta  Meta infos like: { name: 'name', version: 1 }
 * @param {Function} transformFn Fuction handle
 *                         `function(evt, clb){}`
 * @constructor
 */
function LoadingEventTransformer (meta, transformFn) {
  Definition.call(this, meta);

  meta = meta || {};

  if (transformFn && !_.isFunction(transformFn)) {
    var err = new Error('Transform function not injected!');
    debug(err);
    throw err;
  }

  this.version = meta.version;

  this.transformFn = transformFn;
}

util.inherits(LoadingEventTransformer, Definition);

_.extend(LoadingEventTransformer.prototype, {

  /**
   * transform an LoadingEventTransformer.
   * @param {Object}   evt      The LoadingEventTransformer object.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, evt){}`
   */
  transform: function (evt, callback) {
    var self = this;
    var callbacked = false;

    function handleError (err) {
      debug(err);
      callbacked = true;
      callback(err);
    }

    try {
      if (this.transformFn.length === 2) {
        this.transformFn(_.cloneDeep(evt), function (err, newEvt) {
          if (err) return handleError(err);
          callbacked = true;
          callback(null, newEvt);
        });
      } else {
        var newEvt = this.transformFn(_.cloneDeep(evt));
        callback(null, newEvt);
      }
    } catch (err) {
      if (!callbacked) {
        return handleError(err);
      }
      throw err;
    }
  }

});

module.exports = LoadingEventTransformer;
