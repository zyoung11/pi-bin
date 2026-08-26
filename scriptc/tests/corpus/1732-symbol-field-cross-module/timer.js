// A class with symbol-keyed fields AND the key itself exported: importers
// resolve the key back to this module's unique-symbol const, so their
// element accesses land on the same hidden slot the constructor declared.
'use strict';

const kTicks = Symbol('ticks');

class Timer {
  constructor(start) {
    this[kTicks] = start;
  }

  tick() {
    this[kTicks] += 1;
    return this[kTicks];
  }
}

module.exports = { Timer, kTicks };
