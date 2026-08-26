// SC2005: a value whose type keeps a generic call signature — no concrete
// instance exists for the slot to hold (the monomorphization rule).

const id = <T>(x: T): T => x;
const stored = id;
console.log(stored(1));

// A slot ANNOTATED with a generic signature fences the same way.
let held: <T>(x: T) => T = id;
held = id;
console.log(held(2));
