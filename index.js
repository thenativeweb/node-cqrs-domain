module.exports = {
	version: require('./package.json').version,
	domain: require('./lib/domain'),
	aggregateBase: require('./lib/bases/aggregateBase'),
  commandHandlerBase: require('./lib/bases/commandHandlerBase'),
	sagaBase: require('./lib/bases/sagaBase'),
	sagaHandlerBase: require('./lib/bases/sagaHandlerBase')
};