'use strict';

function Definition (meta) {
  if (!this.name) {
    this.name = meta.name;
  }
  
  if (!this.name) {
    this.name = path.basename(__filename, '.js')
  }
}

module.exports = Definition;
