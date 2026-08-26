// Object-literal get/set accessors, the record dispatch basics: getter
// reads and setter writes over captured state, get-only and set-only
// properties, accessors mixed with data fields and closure-valued fields,
// computed literal-key accessors, and accessor records crossing annotated
// function boundaries (type-literal and interface accessor members map to
// the same shape). Node is the oracle byte-for-byte.

function makePoint(x0: number) {
  let x = x0;
  let writes = 0;
  return {
    b: 10,
    get x() { return x; },
    set x(v: number) { writes++; x = v * 2; },
    get writes() { return writes; },
  };
}

const p = makePoint(3);
console.log(p.x, p.b, p.writes);
p.x = 5;
console.log(p.x, p.writes);
p.x = p.x + 1;
console.log(p.x, p.writes);

// get-only: reads fold through the closure, no setter slot exists
const ro = { get v() { return 40 + 2; } };
console.log(ro.v, ro.v);

// set-only: writes dispatch, the captured sink observes them
let sunk = 0;
const wo = { set sink(v: number) { sunk = v + 1; } };
wo.sink = 7;
wo.sink = sunk;
console.log(sunk);

// accessors beside data fields and closure-valued fields
const mixed = {
  label: "m",
  scale: (n: number) => n * 3,
  get doubled() { return mixed.scale(2); },
};
console.log(mixed.label, mixed.doubled, mixed.scale(4));

// computed literal keys fold to their string — accessor spelling included
const g = {
  get ["hello"]() { return "world"; },
};
console.log(g.hello);

// a getter returning a function, called straight through the property
const ops = {
  get add() { return (a: number, b: number) => a + b; },
};
console.log(ops.add(2, 3));

// annotated boundaries: type-literal and interface accessor members
function readX(pt: { b: number; get x(): number; set x(v: number); get writes(): number }): number {
  return pt.x;
}
interface Gauge {
  get level(): number;
}
function readLevel(gauge: Gauge): number {
  return gauge.level;
}
console.log(readX(p), readLevel({ get level() { return 12; } }));

// the setter half through an annotation too
function bump(pt: { get x(): number; set x(v: number) }): void {
  pt.x = pt.x + 10;
}
bump(p);
console.log(p.x);

// getter/setter pair with the setter's param type inferred from the getter
let agreed = 1;
const o1 = { get foo() { return agreed; }, set foo(val) { agreed = val; } };
o1.foo = o1.foo + 41;
console.log(o1.foo);
