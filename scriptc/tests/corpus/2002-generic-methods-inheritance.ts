// Generic methods dispatch STATICALLY (no per-instantiation vtable slots):
// inherited methods resolve up the chain, overrides resolve when the
// receiver's runtime class is statically exact, and super calls are the
// base chain's implementation — all verified against Node.
class Base {
  who<T>(x: T): string {
    return `base:${String(x)}`;
  }
}
class Mid extends Base {}
class Leaf extends Mid {
  who<T>(x: T): string {
    return `leaf:${String(x)}/${super.who(x)}`;
  }
}

// Inherited through a subclass instance (no override in sight on Mid).
const mid = new Mid();
console.log(mid.who(1));
console.log(mid.who("m"));

// Exact receivers: a const bound to its `new` expression proves the
// runtime class, so the override resolves at compile time — including a
// base-ANNOTATED const provably holding the subclass.
const leaf = new Leaf();
console.log(leaf.who(2));
const asBase: Base = new Leaf();
console.log(asBase.who("x"));
const plainBase = new Base();
console.log(plainBase.who(3));
console.log(new Leaf().who(false));

// The vtable world is untouched: plain methods on the same classes keep
// their ordinary virtual dispatch next to the generic ones.
class P1 {
  name(): string {
    return "p1";
  }
  fmt<T>(x: T): string {
    return `${this.name()}:${String(x)}`;
  }
}
class P2 extends P1 {
  name(): string {
    return "p2";
  }
}
function describe(p: P1): string {
  return p.name();
}
console.log(describe(new P1()), describe(new P2()));
const p2 = new P2();
// fmt is inherited (not overridden): the instance's virtualCall of name()
// inside still sees the DYNAMIC class.
console.log(p2.fmt(9));
console.log(new P1().fmt("q"));
