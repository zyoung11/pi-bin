// Generic methods ON generic classes: one compiled method instance per
// (receiver instantiation × method instantiation) — the method body lowers
// under the class instantiation's bindings merged with its own.
class Box<T> {
  v: T;
  constructor(v: T) {
    this.v = v;
  }
  map<U>(f: (x: T) => U): Box<U> {
    return new Box(f(this.v));
  }
  zip<U>(u: U): string {
    return `${String(this.v)}~${String(u)}`;
  }
}

const nb = new Box(10);
console.log(nb.map((n) => n * 2).v);
console.log(nb.map((n) => `n=${n}`).v);
console.log(nb.zip("s"));
console.log(nb.zip(false));

const sb = new Box("str");
console.log(sb.map((s) => s.length).v);
console.log(sb.zip(1));

// A generic method's instantiation can demand a NEW class instantiation
// (Box<boolean> exists only through this map) — the joint fixpoint.
console.log(nb.map((n) => n > 5).v);
