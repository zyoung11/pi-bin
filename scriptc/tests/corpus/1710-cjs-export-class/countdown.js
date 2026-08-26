// The Node test suite's common/countdown.js shape, minus its symbol-keyed
// storage (fenced honestly): a JS class whose FIELDS are declared by
// constructor assignment from UNTYPED params (checked-dynamic slots),
// exported as the module's single value — `module.exports = Countdown`.
// The requirer's binding IS the class.
'use strict';

const assert = require('assert');

class Countdown {
  constructor(limit, cb) {
    assert.strictEqual(typeof limit, 'number');
    assert.strictEqual(typeof cb, 'function');
    this.limit = limit;
    this.cb = cb;
  }

  dec() {
    assert(this.limit > 0, 'Countdown expired');
    if (--this.limit === 0)
      this.cb();
    return this.limit;
  }

  get remaining() {
    return this.limit;
  }
}

module.exports = Countdown;
