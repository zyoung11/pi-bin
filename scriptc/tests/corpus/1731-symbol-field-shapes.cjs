// Symbol-keyed class fields beyond the countdown core: mixed string- and
// symbol-keyed slots on one instance (inspect lists string keys first,
// then symbol keys — [[OwnPropertyKeys]] order), typed slots (a literal
// initializer infers number, so the hidden field is f64), reads/writes
// from OUTSIDE the class, compound assignment and statement/expression
// inc/dec through the symbol spelling, inheritance (a derived class reads
// and writes the base's symbol-keyed slot; a second symbol extends the
// layout), and description-less keys.
'use strict';

const { inspect } = require('util');

const kCount = Symbol('count');
const kLabel = Symbol('label');
const kAnon = Symbol();
const kExtra = Symbol('extra');

class Box {
  constructor(count, label) {
    this.name = 'box';
    this[kCount] = count;
    this[kLabel] = label;
    this[kAnon] = 10;
  }

  bump() {
    this[kCount] += 2;
    this[kCount]++;
    --this[kCount];
    return this[kCount];
  }

  describe() {
    return `${this.name}: ${this[kLabel]} = ${this[kCount]}`;
  }
}

const b = new Box(5, 'five');
console.log(b.describe());
console.log('bump ->', b.bump());
console.log('anon slot:', b[kAnon], typeof b[kAnon]);

// Outside the class: reads, writes, compound and postfix through the
// same compile-time key.
b[kCount] = 40;
b[kCount] += 1;
console.log('outside write ->', b[kCount]);
console.log('postfix old:', b[kAnon]++, 'new:', b[kAnon]);
console.log('prefix new:', ++b[kAnon]);

// Node's inspect: string keys first, then Symbol(...) keys in
// assignment order; the description-less key prints Symbol().
// (Box itself has a subclass below, and inspect of non-leaf classes
// keeps its fence — a LEAF twin carries the same mixed layout.)
class Chip {
  constructor(count, label) {
    this.name = 'chip';
    this[kCount] = count;
    this[kLabel] = label;
    this[kAnon] = 10;
  }
}
console.log(inspect(new Chip(41, 'five')));

// Inheritance: the derived constructor writes the BASE's symbol slot
// (a write, not a redeclaration) and adds its own symbol-keyed field.
class Tagged extends Box {
  constructor(count) {
    super(count, 'tagged');
    this[kCount] = count * 2;
    this[kExtra] = 'extra-slot';
  }

  extra() {
    return this[kExtra];
  }
}

const t = new Tagged(3);
console.log(t.describe());
console.log('extra:', t.extra());
console.log('base read of derived:', t[kCount], t[kExtra]);
console.log(inspect(t));
