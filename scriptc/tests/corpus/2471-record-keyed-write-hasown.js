// Fixed-shape records under the keyed-write dispatch: same-typed declared
// fields write by runtime key, Object.hasOwn answers the declared-key set
// with undefined-armed fields reading by tag, and Object.assign copies
// same-shape records with the not-undefined guard. (The keyed-write MISS
// throws where JS adds a property — the documented divergence, exercised
// in the errors harness, not against the Node oracle.)
const counters = { a: 1, b: 2, c: 3 };
const key = "b" + "";
counters[key] = 20;
console.log(counters.a, counters.b, counters.c);
console.log(Object.hasOwn(counters, "a"), Object.hasOwn(counters, key), Object.hasOwn(counters, "zzz"));

/** @type {{ x: number, y?: string }} */
const opt = { x: 1 };
console.log(Object.hasOwn(opt, "x"), Object.hasOwn(opt, "y"));
opt.y = "set";
console.log(Object.hasOwn(opt, "y"));

const target = { a: 9, b: 9, c: 9 };
Object.assign(target, counters);
console.log(target.a, target.b, target.c);
console.log("done");
