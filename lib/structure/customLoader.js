var definitions = {
  Context: require('./../definitions/context'),
  Aggregate: require('./../definitions/aggregate'),
  Command: require('./../definitions/command'),
  Event: require('./../definitions/event'),
  BusinessRule: require('./../definitions/businessRule'),
  PreCondition: require('./../definitions/preCondition'),
  PreLoadCondition: require('./../definitions/preLoadCondition'),
  LoadingEventTransformer: require('./../definitions/loadingEventTransformer'),
  CommittingEventTransformer: require('./../definitions/committingEventTransformer'),
  CommandHandler: require('./../definitions/commandHandler'),
  errors: {
    BusinessRuleError: require('../errors/businessRuleError'),
    ValidationError: require('../errors/validationError'),
  }
}

module.exports = function (loader) {
  return function(domainPath, validatorExtension, useLoaderExtensions, callback) {
    var options = {
      domainPath: domainPath,
      definitions: definitions,
      validatorExtension: validatorExtension,
      useLoaderExtensions: useLoaderExtensions,
    };
    var tree;

    // async
    if (loader.length > 1) {
      return loader(options, callback);
    }

    // sync
    try {
      tree = loader(options);
    } catch(e) {
      return callback(e);
    }
    callback(null, tree);
  };
}
