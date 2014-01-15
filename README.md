# Introduction

[![Build Status](https://secure.travis-ci.org/adrai/node-cqrs-domain.png)](http://travis-ci.org/adrai/node-cqrs-domain)

Node-cqrs-domain is a node.js module based on [nodeEventStore](http://jamuhl.github.com/nodeEventStore/).
It can be very useful as domain component if you work with (d)ddd, cqrs, eventdenormalizer, host, etc.

# Installation

    $ npm install cqrs-domain

# Usage

## Initialization

	var domain = require('cqrs-domain').domain;

	domain.on('event', function(evt) {
        // send to bus
    });
    domain.initialize({
        commandHandlersPath: __dirname + '/commandHandlers',
        aggregatesPath: __dirname + '/aggregates',
        sagaHandlersPath: __dirname + '/sagaHandlers',
        sagasPath: __dirname + '/sagas',
        snapshotThreshold: 10,
        forcedQueuing: false,
        disableQueuing: false,
        handleUpdispatchedEvents: true//,
        // retryOnConcurrencyTimeout: 800,
        // commandLock: { type: 'inMemory', collectionName: 'commandlock' }
    }, function(err) {

    });

    domain.handle({ id: 'msgId', command: 'changeDummy', payload: { id: '23445' } }, function(err) {

    });

## Define aggregates...

    var base = require('cqrs-domain').aggregateBase;

    module.exports = base.extend({

        changeDummy: function(data, callback) {
            this.apply(this.toEvent('dummyChanged', data));

            this.checkBusinessRules(callback);
        },

        destroyDummy: function(data, callback) {
            this.apply(this.toEvent('dummyDestroyed', data));

            this.checkBusinessRules(callback);
        },

        cancelDummy: function(data, callback) {
            this.apply(this.toEvent('dummyCancelled', data));

            this.checkBusinessRules(callback);
        },

        dummyChanged: function(data) {
            this.set(data);
        },

        dummyCancelled: function(data) {
            this.set('cancelled', true);
        },

        dummyDestroyed: function(data) {
            this.set('destroyed', true);
        }

    });

See [tests](https://github.com/adrai/node-cqrs-domain/tree/master/test) for detailed information...

# Release Notes

## v0.7.3

- updated eventstore

## v0.7.2

- update dependencies

## v0.7.1

- load sagas always from db

## v0.7.0

- introduced commandLock for distributed domain (handling same aggregate instance on multiple machines)

## v0.6.1

- buffer commands by aggregate id
>>>>>>> 2c334aca7fffdae5fd1ff21fe0044c1a51100356

## v0.6.0

- don't publish in eventstore but publish in domain
- removed flags: publishingInterval, forkEventDispatching
- added handleUpdispatchedEvents flag

## v0.5.3

- fix for async business rules (issue [#13](https://github.com/adrai/node-cqrs-domain/issues/13))

## v0.5.2

- fix commandDispatcher if no commandqueue is used

## v0.5.0

- a complete change of validation rules (see new [rule-validator](https://github.com/adrai/rule-validator))

## v0.4.4

- added disableQueuing flag

## v0.4.3

- strip .js file extensions to enable loading of .coffee scripts too

## v0.4.2

- added forcedQueuing flag

## v0.4.1

- added optional snapshotThreshold on aggregate

## v0.4.0

- asynchronous api for saga

## v0.3.9

- optimized performance a little

## v0.3.8

- updated eventstore package
- optimized initialization


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