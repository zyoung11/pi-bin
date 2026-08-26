// Record literals evaluate field values in SOURCE order (not shape/canonical
// order), observable through side effects. Also: shorthand properties and
// shorthand methods.
let trace = "";
const tap = (label: string, value: number): number => {
  trace += label;
  return value;
};
// source order z, a, m — canonical (struct) order is a, m, z
const scrambled = { z: tap("z", 1), a: tap("a", 2), m: tap("m", 3) };
console.log(trace, scrambled.a, scrambled.m, scrambled.z);

// nested literals: inner records evaluate where they appear
trace = "";
const nested = {
  second: { late: tap("2", 0) },
  first: tap("1", 5),
};
console.log(trace, nested.first, nested.second.late);

// side effects run even for fields never read afterwards
trace = "";
const fireAndForget = { boom: tap("!", 9) };
console.log(trace, fireAndForget.boom);

// shorthand properties: `{ x }` reads the binding at literal-evaluation time
const x = 41;
let y = 1;
const short = { x, y };
y = 1000; // does not affect the record (copied at evaluation)
console.log(short.x + short.y, y);

// shorthand methods are closure-valued fields; calling and passing them works
const calc = {
  base: 10,
  add(n: number): number {
    return n + 1;
  },
  describe(): string {
    return "calc";
  },
};
console.log(calc.add(calc.base), calc.describe());
const detached = calc.add;
console.log(detached(5));

// evaluation order interacts with mutation: later fields see earlier effects
let counter = 0;
const next = () => {
  counter++;
  return counter;
};
const ordered = { b: next(), a: next(), c: next() };
console.log(ordered.b, ordered.a, ordered.c, counter);
