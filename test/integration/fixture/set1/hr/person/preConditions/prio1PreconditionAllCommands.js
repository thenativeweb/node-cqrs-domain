module.exports = require('../../../../../../../').definePreCondition({
  name: '',
  description: 'Fails if firstname is rumpelstilz',
  priority: 1
}, function (command) {
  if (command.payload.firstname === 'rumpelstilz') {
    throw new Error('Precondition with prio 1 failed (all commands)');
  }
});