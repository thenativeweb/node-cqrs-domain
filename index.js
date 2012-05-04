var index;

if (typeof module.exports !== 'undefined') {
    index = module.exports;
} else {
    index = root.index = {};
}

index.VERSION = '0.0.1';

index.domain = require('./lib/domain');
index.aggregateBase = require('./lib/bases/aggregateBase');
index.commandHandlerBase = require('./lib/bases/commandHandlerBase');
index.sagaBase = require('./lib/bases/sagaBase');
index.sagaHandlerBase = require('./lib/bases/sagaHandlerBase');