// Symbols in containers: arrays hold identities (SCR_ELEM_REF), Sets hash
// by identity (SameValueZero on symbols IS pointer identity — distinct
// same-description symbols are distinct elements), and record/class
// fields alias like any reference.
const k1: symbol = Symbol("k");
const k2: symbol = Symbol("k");
const reg: symbol = Symbol.for("reg");

const syms: symbol[] = [k1, k2, reg];
console.log(syms.length);
console.log(syms[0] === k1);
console.log(syms[0] === syms[1]);
console.log(syms[2] === Symbol.for("reg"));

const set = new Set<symbol>();
set.add(k1);
console.log(set.has(k1), set.has(k2), set.size);
set.add(k2);
set.add(k1); // duplicate: identity says already present
console.log(set.size);
set.delete(k1);
console.log(set.has(k1), set.has(k2), set.size);

// Seeded construction, duplicates collapsing by identity.
const seeded = new Set<symbol>([k1, k2, k1, reg]);
console.log(seeded.size);

// Record fields and optional unions.
const box: { key: symbol; label: string } = { key: k1, label: "box" };
console.log(box.key === k1);
console.log(box.key.description ?? "(none)");

let pending: symbol | undefined;
console.log(pending === undefined);
pending = reg;
console.log(pending !== undefined ? pending.toString() : "(unset)");

// Class fields of symbol type, identity through methods.
class Token {
  readonly id: symbol;
  constructor(id: symbol) {
    this.id = id;
  }
  matches(other: symbol): boolean {
    return this.id === other;
  }
}
const t = new Token(k2);
console.log(t.matches(k2), t.matches(k1));
console.log(t.id.toString());
