module.exports = require('../../../../../../../').definePreCondition({
  name: 'enterNewPerson2',
  description: 'Fails if firstname is rumpelstilz',
  priority: 2
}, function (command) {
  if (command.payload.firstname === 'rumpelstilz1') {
    throw new Error('Precondition with prio 2 failed (specific command)');
  }
});