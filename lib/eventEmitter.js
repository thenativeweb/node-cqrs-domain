var EventEmitter2 = require('eventemitter2').EventEmitter2
  , eventEmitter;

module.exports = eventEmitter = new EventEmitter2({
	wildcard: true,
	delimiter: ':',
	maxListeners: 1000 // default would be 10!
});

eventEmitter.registered = {};

eventEmitter.register = function(evtName) {
	this.registered[evtName] = this.registered[evtName] || 0;
	this.registered[evtName]++; 
};

eventEmitter.registerCount = function(evtName) {
	this.registered[evtName] = this.registered[evtName] || 0;
	return this.registered[evtName];
};