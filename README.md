# Introduction

[![travis](https://img.shields.io/travis/adrai/node-cqrs-domain.svg)](https://travis-ci.org/adrai/node-cqrs-domain) [![npm](https://img.shields.io/npm/v/cqrs-domain.svg)](https://npmjs.org/package/cqrs-domain)

Node-cqrs-domain is a node.js module based on [node-eventstore](http://adrai.github.com/node-eventstore/).
It can be very useful as domain component if you work with (d)ddd, cqrs, eventdenormalizer, host, etc.

# Installation

    npm install cqrs-domain

# Usage

	var domain = require('cqrs-domain', {
	  // the path to the "working directory"
	  // can be structured like
	  // [set 1](https://github.com/adrai/node-cqrs-domain/tree/1.0/test/integration/fixture/set1) or
	  // [set 2](https://github.com/adrai/node-cqrs-domain/tree/1.0/test/integration/fixture/set2)
	  domainPath: '/path/to/my/files',
	  
	  // optional, default is 'commandRejected'
	  // will be used if an error occurs and an event should be generated
	  commandRejectedEventName: 'rejectedCommand',
	  
	  // optional, default is 800
	  // if using in scaled systems and not guaranteeing that each command for an aggregate instance
	  // dispatches to the same worker process, this module tries to catch the concurrency issues and
	  // retries to handle the command after a timeout between 0 and the defined value
	  retryOnConcurrencyTimeout: 1000,
	  
	  // optional, default is 100
	  // global snapshot threshold value for all aggregates
	  // defines the amount of loaded events, if there are more events to load, it will do a snapshot, so next loading is faster
	  // an individual snapshot threshold defining algorithm can be defined per aggregate (scroll down)
	  snapshotThreshold: 1000,
	  
	  // optional, default is in-memory
	  // currently supports: mongodb, redis, tingodb and inmemory
	  // hint: [eventstore](https://github.com/adrai/node-eventstore#provide-implementation-for-storage)
	  eventStore: {
	    type: 'mongodb',
	    host: 'localhost',                          // optional
	    port: 27017,                                // optional
	    dbName: 'domain',                           // optional
	    eventsCollectionName: 'events',             // optional
	    snapshotsCollectionName: 'snapshots',       // optional
	    transactionsCollectionName: 'transactions', // optional
	    timeout: 10000                              // optional
	    // username: 'technicalDbUser',                // optional
	    // password: 'secret'                          // optional
	  },
     	  
	  // optional, default is in-memory
	  // currently supports: mongodb, redis, tingodb, couchdb and inmemory
	  // hint settings like: [eventstore](https://github.com/adrai/node-eventstore#provide-implementation-for-storage)
	  aggregateLock: {
	    type: 'redis',
	    host: 'localhost',                          // optional
	    port: 6379,                                 // optional
	    db: 0,                                      // optional
	    prefix: 'domain_aggregate_lock',            // optional
	    timeout: 10000                              // optional
	    // password: 'secret'                          // optional
	  }
	});

	
## Define the command structure
The values describes the path to that property in the command message.

	domain.defineCommand({
	  // optional, default is 'id'
	  id: 'id'
	  
	  // optional, default is 'name'
	  name: 'name',
	  
	  // optional, default is 'aggregate.id'
	  // if an aggregate id is not defined in the command, the command handler will create a new aggregate instance
	  aggregateId: 'aggregate.id',
	  
	  // optional, only makes sense if contexts are defined in the 'domainPath' structure 
	  context: 'context.name',
	  
	  // optional, only makes sense if aggregates with names are defined in the 'domainPath' structure
	  aggregate: 'aggregate.name',
	  
	  // optional, but recommended
	  payload: 'payload',
	  
	  // optional, if defined the command handler will check if the command can be handled
	  // if you want the command to be handled in a secure/transactional way pass a revision value that matches the current aggregate revision
	  revision: 'revision',
	  
	  // optional, if defined the command handler will search for a handle that matches command name and version number
	  version: 'version',
	  
	  // optional, if defined theses values will be copied to the event (can be used to transport information like userId, etc..)
	  meta: 'meta'
	});


## Define the event structure
The values describes the path to that property in the event message.

	domain.defineCommand({
	  // optional, default is 'correlationId'
	  // will use the command id as correlationId, so you can match it in the sender 
	  correlationId: 'correlationId',
	  
	  // optional, default is 'id'
	  id: 'id'
	  
	  // optional, default is 'name'
	  name: 'name',
	  
	  // optional, default is 'aggregate.id'
	  aggregateId: 'aggregate.id',
	  
	  // optional, only makes sense if contexts are defined in the 'domainPath' structure 
	  context: 'context.name',
	  
	  // optional, only makes sense if aggregates with names are defined in the 'domainPath' structure
	  aggregate: 'aggregate.name',
	  
	  // optional, default is 'payload'
	  payload: 'payload',
	  
	  // optional, default is 'revision'
	  // will represent the aggregate revision, can be used in next command
	  revision: 'revision',
	  
	  // optional
	  version: 'version',
	  
	  // optional, if defined the values of the command will be copied to the event (can be used to transport information like userId, etc..)
	  meta: 'meta'
	});


## Define the id generator function [optional]
### you can define a synchronous function

	domain.idGenerator(function() {
	  var id = require('node-uuid').v4().toString();
	  return id;
	});

### or you can define an asynchronous function

	domain.idGenerator(function(callback) {
	  setTimeout(function() {
	    var id = require('node-uuid').v4().toString();
	    callback(null, id);
	  }, 50);
	});


## Wire up events [optional]
### you can define a synchronous function

	// pass events to bus
	domain.onEvent(function(evt) {
	  bus.emit('event', evt);
	});
	
### or you can define an asynchronous function

	// pass events to bus
	domain.onEvent(function(evt, callback) {
	  bus.emit('event', evt, function ack () {
	    callback();
	  });
	});


## Initialization
	
	domain.init(function (err) {
	  // this callback is called when all is ready...
	});
	
	// or
	
	domain.init(); // callback is optional
	

## Handling a command


	domain.handle({
	  id: 'b80ade36-dd05-4340-8a8b-846eea6e286f',
	  name: 'enterNewPerson',
	  aggregate: {
	    id: '3b4d44b0-34fb-4ceb-b212-68fe7a7c2f70',
	    name: 'person'
	  },
	  context: {
	    name: 'hr'
	  },
	  payload: {
	    firstname: 'Jack',
	    lastname: 'Huston'
	  },
	  revision: 0,
	  version: 1,
	  meta: {
	    userId: 'ccd65819-4da4-4df9-9f24-5b10bf89ef89'
	  }
	}); // callback is optional
	
### or
	
	domain.handle({
	  id: 'b80ade36-dd05-4340-8a8b-846eea6e286f',
	  name: 'renamePerson',
	  aggregate: {
	    id: '3b4d44b0-34fb-4ceb-b212-68fe7a7c2f70',
	    name: 'person'
	  },
	  context: {
	    name: 'hr'
	  },
	  payload: {
	    firstname: 'Jack',
	    lastname: 'Huston'
	  },
	  revision: 0,
	  version: 1,
	  meta: {
	    userId: 'ccd65819-4da4-4df9-9f24-5b10bf89ef89'
	  }
	}, function (err) {
	  // this callback is called when command is handled successfully or unsuccessfully
	  // err can be of type:
	  // - null
	  // - Error
	  //   {
	  //     name: 'Error',
	  //     message: 'optional message'
	  //   }
	  // - ValidationError
	  //   {
	  //     name: 'ValidationError',
	  //     message: 'some message',
	  //     more: { /* more infos */ }
	  //   }
	  // - BusinessRuleError
	  //   {
	  //     name: 'BusinessRuleError',
	  //     message: 'some message'
	  //   }
	  // - AggregateDestroyedError
	  //   {
	  //     name: 'AggregateDestroyedError',
	  //     message: 'Aggregate has already been destroyed!',
	  //     more: {
	  //       aggregateId: 'ad10d2c0-6509-4cb0-86d2-76312d930001',
	  //       aggregateRevision: 6
	  //     }
	  //   }
	  // - AggregateConcurrencyError
	  //   {
	  //     name: 'AggregateConcurrencyError',
	  //     message: 'Actual revision in command is "3", but expected is "2"!',
	  //     more: {
	  //       aggregateId: 'ad10d2c0-6509-4cb0-86d2-76312d930001',
	  //       aggregateRevision: 2,
	  //       commandRevision: 3
	  //     }
	  //   }
	});
	
### more infos, can be useful if testing
	
	domain.handle({
	  id: 'b80ade36-dd05-4340-8a8b-846eea6e286f',
	  name: 'renamePerson',
	  aggregate: {
	    id: '3b4d44b0-34fb-4ceb-b212-68fe7a7c2f70',
	    name: 'person'
	  },
	  context: {
	    name: 'hr'
	  },
	  payload: {
	    firstname: 'Jack',
	    lastname: 'Huston'
	  },
	  revision: 0,
	  version: 1,
	  meta: {
	    userId: 'ccd65819-4da4-4df9-9f24-5b10bf89ef89'
	  }
	}, function (err, events, aggregateData, metaInfos) {
	  // this callback is called when command is handled successfully or unsuccessfully
	  // err: is the same as described before
	  
	  // events: same as passed in 'onEvent' function
	  // events: in case of no error here is the array of all events that should be published
	  // events: in case of error are the one of these Errors (ValidationError, BusinessRuleError, AggregateDestroyedError, AggregateConcurrencyError)
	  // converted in an event with the event name defined in the options (default is 'commandRejected')
	  
	  // aggregateData: represents the aggregateData after applying the resulting events
	  
	  // metaInfos: { aggregateId: '3b4d44b0-34fb-4ceb-b212-68fe7a7c2f70', aggregate: 'person', context: 'context' }
	});


# Components definition

## Context

	module.exports = require('cqrs-domain').defineContext({
	  // optional, default is the directory name
	  name: 'hr'
	});


## Aggregate

	module.exports = require('cqrs-domain').defineAggregate({
	  // optional, default is last part of path name
	  name: 'person',
	  
	  // optional, default 0
	  version: 3
	},
	
	// optionally, define some initialization data...
	{
	  emails: ['default@mycomp.org'],
	  phoneNumbers: []
	})
	
	// optionally, define snapshot need algorithm...
	.defineSnapshotNeed(function (loadingTime, events, aggregateData) {
	  // loadingTime is the loading time in ms of the eventstore data
	  // events are all loaded events in an array
	  // aggregateData represents the aggregateData after applying the resulting events
	  return events.length >= 200;
	})
	
	// optionally, define conversion algorithm for older snapshots
	// always convert directly to newest version...
	// when loaded a snapshot and it's an older snapshot, a new snapshot with same revision but with newer aggregate version will be created
	.defineSnapshotConversion({
	  version: 1
	}, function (data, aggregate) {
	  // data is the snapshot data
	  // aggregate is the aggregate object
	  
	  aggregate.set('emails', data.emails);
	  aggregate.set('phoneNumbers', data.phoneNumbers);
	
	  var names = data.name.split(' ');
	  aggregate.set('firstname', names[0]);
	  aggregate.set('lastname', names[1]);
	});



[Release notes](https://github.com/adrai/node-cqrs-domain/blob/master/releasenotes.md)

# License

Copyright (c) 2014 Adriano Raiano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
