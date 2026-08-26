// Rest properties in declarations over record shapes: the unconsumed
// fields pack into a FRESH record (JS's CopyDataProperties), renamed
// siblings consume their SOURCE field, and the rest object's key order
// matches Node's.
const cfg = { alpha: 1, beta: 2, gamma: 3, delta: 4 };
const { alpha, ...rest } = cfg;
console.log(alpha, rest.beta, rest.gamma, rest.delta);
console.log(JSON.stringify(rest));
console.log(Object.keys(rest).join(","));

// Renames consume the source field, not the binding name.
const { beta: renamed, ...afterRename } = cfg;
console.log(renamed, JSON.stringify(afterRename));

// Everything consumed: the rest is a fresh empty record.
const small = { one: 1 };
const { one, ...empty } = small;
console.log(one, JSON.stringify(empty));

// Nothing consumed: a fresh shallow copy.
const { ...all } = cfg;
console.log(JSON.stringify(all));

// The copy is fresh — writes through it never reach the source.
const target = { m: 1, n: 2 };
const { ...copy } = target;
copy.m = 99;
console.log(target.m, copy.m);

// Rest beside defaults and nesting.
const shaped: { a?: number; b: { c: number }; d: string } = { b: { c: 7 }, d: "x" };
const { a: maybe = -5, b: { c }, ...tail } = shaped;
console.log(maybe, c, JSON.stringify(tail));
