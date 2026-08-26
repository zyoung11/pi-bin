// RC stress through accessors: string-typed getter/setter churn (the
// setter's param ownership follows callee-owns like every method), array
// values flowing through accessor reads and writes, and virtual accessor
// dispatch in hot loops. The sanitized lane audits every count.
class Buf {
  _s: string = "";
  get s(): string {
    return this._s;
  }
  set s(v: string) {
    this._s = v;
  }
}
const b = new Buf();
for (let i = 0; i < 1000; i++) {
  b.s += "x";
  const t = b.s;
  if (t.length > 500) {
    b.s = "";
  }
}
console.log(b.s.length);

// Arrays through accessors: reads alias (reference semantics), writes
// replace, filter allocates fresh arrays every round.
class Pool {
  _items: string[] = [];
  get items(): string[] {
    return this._items;
  }
  set items(v: string[]) {
    this._items = v;
  }
}
const p = new Pool();
for (let i = 0; i < 200; i++) {
  const arr = p.items;
  arr.push("item" + i);
  p.items = arr.filter((s) => s.length < 7);
}
console.log(p.items.length);

// Virtual accessor dispatch churning strings through base-typed calls.
class Tag {
  _n: string = "a";
  get name(): string {
    return this._n;
  }
  set name(v: string) {
    this._n = v;
  }
}
class LoudTag extends Tag {
  get name(): string {
    return this._n + "!";
  }
  set name(v: string) {
    this._n = "<" + v + ">";
  }
}
function churn(t: Tag, rounds: number): string {
  for (let i = 0; i < rounds; i++) {
    t.name = t.name + i;
    if (t.name.length > 80) {
      t.name = "reset";
    }
  }
  return t.name;
}
console.log(churn(new Tag(), 300).length);
console.log(churn(new LoudTag(), 300).length);

// Getter-only override shadow-throw in a loop: the thrown error is caught
// and released cleanly every iteration.
class Box {
  _v: string = "seed";
  get v(): string {
    return this._v;
  }
  set v(x: string) {
    this._v = x;
  }
}
class SealedBox extends Box {
  get v(): string {
    return this._v + "(sealed)";
  }
}
const sealed: Box = new SealedBox();
const open: Box = new Box();
let caught = 0;
for (let i = 0; i < 100; i++) {
  const target = i % 2 === 0 ? sealed : open;
  try {
    target.v = "round" + i;
  } catch {
    caught++;
  }
}
console.log(caught, open.v, sealed.v);
