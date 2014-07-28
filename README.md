# Introduction

[![travis](https://img.shields.io/travis/adrai/node-cqrs-domain.svg)](https://travis-ci.org/adrai/node-cqrs-domain) [![npm](https://img.shields.io/npm/v/cqrs-domain.svg)](https://npmjs.org/package/cqrs-domain)

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
        handleUndispatchedEvents: true//,
        // retryOnConcurrencyTimeout: 800,
        // commandLock: { type: 'inMemory', collectionName: 'commandlock' }
    }, function(err) {

    });

    domain.handle({ id: 'msgId', command: 'changeDummy', payload: { id: '23445' } }, function(err) {

    });

## Define aggregates...

    var base = require('cqrs-domain').aggregateBase;

    module.exports = base.extend({

        // snapshotThreshold: 20, 
        // or
        // snapshotThreshold: function() { return 12 + 10; },
        // 
        // used to version the snap shots
        // version: 3,
        // 
        // laodSnapshot: function(data, version) {
        //     if (version === 1) {
        //         this.set(snap.data);
        //     } else {
        //         this.set(snap.data);
        //     }
        // },

        // commands

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

        fooIt: function(data, callback) {
            this.apply(this.toEvent('fooIted', data));

            this.checkBusinessRules(callback);
        },

        versionedCmd: function(data, callback) {
            this.apply(this.toEvent('versionedEvt', data), callback);
        },

        versionedCmd_1: function(data, callback) {
            this.apply(this.toEvent('versionedEvt', data, 1), callback);
        },


        // events

        dummyChanged: function(data) {
            this.set(data);
        },

        dummyCancelled: function(data) {
            this.set('cancelled', true);
        },

        dummyDestroyed: function(data) {
            this.set('destroyed', true);
        },

        fooIted: function(data) {
            this.set('foo', true);
        },

        versionedEvt: function(data) {
            this.set(data);
        },

        versionedEvt_1: function(data) {
            this.set(data);
        }

    });

See [tests](https://github.com/adrai/node-cqrs-domain/tree/master/test) for detailed information...

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
