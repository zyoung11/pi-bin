// Symbol.for / Symbol.keyFor: the global registry interns ONE symbol per
// key — every Symbol.for(key) call answers the same identity — and keyFor
// answers the key for registered symbols, undefined for plain ones.
// A registered symbol's description IS its key.
const f1: symbol = Symbol.for("app.key");
const f2: symbol = Symbol.for("app.key");
const other: symbol = Symbol.for("other.key");
const plain: symbol = Symbol("app.key");

console.log(f1 === f2);
console.log(f1 === other);
console.log(f1 === plain);
console.log(Symbol.keyFor(f1) ?? "(none)");
console.log(Symbol.keyFor(other) ?? "(none)");
console.log(Symbol.keyFor(plain) ?? "(none)");
console.log(f1.description ?? "(none)");
console.log(f1.toString());

// The registry key can be computed at runtime.
const parts = ["ns", "leaf"];
const dyn1: symbol = Symbol.for(parts.join("."));
const dyn2: symbol = Symbol.for("ns.leaf");
console.log(dyn1 === dyn2);
console.log(Symbol.keyFor(dyn2) ?? "(none)");

// Registered identity flows through functions and locals.
function lookup(): symbol {
  return Symbol.for("app.key");
}
console.log(lookup() === f1);
