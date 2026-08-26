// Generic classes inside extends-hierarchies: a generic class extending a
// concrete base (override exactness, virtual dispatch through base-typed
// slots across instantiations), and the instanceof matrix — all Node-exact.
class Base {
  tag = "b";
  describe(): string {
    return "base";
  }
}
class Wrap<T> extends Base {
  v: T;
  constructor(v: T) {
    super();
    this.v = v;
  }
  describe(): string {
    return `wrap:${this.v}:${this.tag}`;
  }
}

const w = new Wrap(7);
const list: Base[] = [new Base(), w, new Wrap("s"), new Wrap(true)];
console.log(list.map((b) => b.describe()).join(" | "));

// instanceof: the generic name answers for every instantiation; the base
// answers for all of them; instantiations never claim base instances.
console.log(w instanceof Base, w instanceof Wrap, new Base() instanceof Wrap);
const second = list[2]!;
console.log(second instanceof Wrap, second instanceof Base);

// A deeper chain under one instantiation.
class Special extends Wrap<number> {
  constructor() {
    super(99);
  }
  describe(): string {
    return `special:${this.v}`;
  }
}
const s = new Special();
console.log(s.describe(), s instanceof Wrap, s instanceof Base, w instanceof Special);
const asBase: Base = s;
console.log(asBase.describe());
