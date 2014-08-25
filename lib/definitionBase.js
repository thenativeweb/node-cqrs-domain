'use strict';

function Definition (meta) {
  if (!this.name) {
    this.name = meta.name;
  }
}

module.exports = Definition;
