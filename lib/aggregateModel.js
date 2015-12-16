'use strict';

var debug = require('debug')('domain:aggregate'),
  dotty = require('dotty'),
  _ = require('lodash'),
  jsondate = require('jsondate');

/**
 * Aggregate constructor
 * @param {String} id              The aggregate id.
 * @param {Object} modelInitValues Initialization values for model like: { emails: [] } [optional]
 * @constructor
 */
function AggregateModel (id, modelInitValues) {
  if (!id || !_.isString(id)) {
    var err = new Error('No id injected!');
    debug(err);
    throw err;
  }

  this.id = id;

  if (modelInitValues instanceof AggregateModel) {
    this.attributes = modelInitValues.toJSON();
  } else {
    this.attributes = _.cloneDeep(modelInitValues || {});
  }

  this.attributes.id = this.id;
  this.attributes._destroyed = this.attributes._destroyed || false;
  this.attributes._revisions = this.attributes._revisions || {};
  this.attributes._revision = this.attributes._revision || 0;

  this.uncommittedEvents = [];
}

AggregateModel.prototype = {

  /**
   * Marks this aggregate as destroyed.
   */
  destroy: function () {
    this.set('_destroyed', true);
  },

  /**
   * Returns true if this aggregate is destroyed.
   * @returns {boolean}
   */
  isDestroyed: function () {
    return !!this.get('_destroyed');
  },

  /**
   * Sets the revision for this aggregate.
   * @param {Object} streamInfo The stream info.
   * @param {Number} rev        The revision number.
   */
  setRevision: function (streamInfo, rev) {
    this.set('_revision', rev);
    streamInfo.context = streamInfo.context || '_general';
    this.get('_revisions')[streamInfo.context + '_' + streamInfo.aggregate + '_' + streamInfo.aggregateId] = rev;
  },

  /**
   * Returns the revision of this aggregate.
   * @param {Object} streamInfo The stream info.
   * @returns {Number}
   */
  getRevision: function (streamInfo) {
    if (!streamInfo) {
      return this.get('_revision');
    }
    streamInfo.context = streamInfo.context || '_general';
    return this.get('_revisions')[streamInfo.context + '_' + streamInfo.aggregate + '_' + streamInfo.aggregateId] || 0;
  },

  /**
   * Returns all uncommitted events.
   * @returns {Array}
   */
  getUncommittedEvents: function () {
    return this.uncommittedEvents;
  },

  /**
   * Adds/Saves an uncommitted event.
   * @param {Object} evt The event object.
   */
  addUncommittedEvent: function (evt) {
    this.uncommittedEvents.push(evt);
  },

  /**
   * Clears the internal uncomitted event list.
   */
  clearUncommittedEvents: function () {
    this.uncommittedEvents = [];
  },

  /**
   * The toJSON function will be called when JSON.stringify().
   * @return {Object} A clean Javascript object containing all attributes.
   */
  toJSON: function () {
    return jsondate.parse(JSON.stringify(this.attributes));
    // return _.cloneDeep(this.attributes);
  },

  /**
   * Sets attributes for the aggregate.
   *
   * @example:
   *     aggregate.set('firstname', 'Jack');
   *     // or
   *     aggregate.set({
   *          firstname: 'Jack',
   *          lastname: 'X-Man'
   *     });
   */
  set: function (data) {
    if (arguments.length === 2) {
      dotty.put(this.attributes, arguments[0], arguments[1]);
    } else if (_.isObject(data)) {
      for (var m in data) {
        dotty.put(this.attributes, m, data[m]);
      }
    }
  },

  /**
   * Gets an attribute of the vm.
   * @param  {String} attr The attribute name.
   * @return {Object}      The result value.
   *
   * @example:
   *     aggregate.get('firstname'); // returns 'Jack'
   */
  get: function (attr) {
    return dotty.get(this.attributes, attr);
  },

  /**
   * Returns `true` if the attribute contains a value that is not null
   * or undefined.
   * @param  {String} attr The attribute name.
   * @return {Boolean}     The result value.
   *
   * @example:
   *     aggregate.has('firstname'); // returns true or false
   */
  has: function (attr) {
    return (this.get(attr) !== null && this.get(attr) !== undefined);
  },

  /**
   * Resets the attributes for the aggregate.
   */
  reset: function (data) {
    if (data instanceof AggregateModel) {
      this.attributes = data.toJSON();
    } else {
      this.attributes = _.cloneDeep(data || {});
    }

    this.attributes.id = this.id;
    this.attributes._destroyed = this.attributes._destroyed || false;
    this.attributes._revision = this.attributes._revision || 0;
  }

};

module.exports = AggregateModel;
