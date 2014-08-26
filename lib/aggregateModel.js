'use strict';

var debug = require('debug')('domain:aggregate'),
  dotty = require('dotty'),
  jsondate = require('jsondate');

function Aggregate (id, name, version) {
  this.id = id;
  this.name = name;
  this.version = version ||0;
  
  this.attributes = { id: this.id, _destroyed: false, _revision: 0 };

  this.uncommittedEvents = [];
}

Aggregate.prototype = {
  
  destroy: function () {
    this.set('_destroyed', true);
  },
  
  isDestroyed: function () {
    return !!this.get('_destroyed');
  },

  setRevision: function (rev) {
    return this.set('_revision', rev);
  },

  getRevision: function () {
    return this.get('_revision');
  },

  getUncommittedEvents: function () {
    return this.uncommittedEvents;
  },

  addUncommittedEvent: function (evt) {
    this.uncommittedEvents.push(evt);
  },

  /**
   * The toJSON function will be called when JSON.stringify().
   * @return {Object} A clean Javascript object containing all attributes.
   */
  toJSON: function () {
    return jsondate.parse(JSON.stringify(this.attributes));
  },

  /**
   * Sets attributes for the vm.
   *
   * @example:
   *     vm.set('firstname', 'Jack');
   *     // or
   *     vm.set({
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
   *     vm.get('firstname'); // returns 'Jack'
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
   *     vm.has('firstname'); // returns true or false
   */
  has: function (attr) {
    return (this.get(attr) !== null && this.get(attr) !== undefined);
  },
  
  apply: function (events) {
    
  }

};

module.exports = Aggregate;
