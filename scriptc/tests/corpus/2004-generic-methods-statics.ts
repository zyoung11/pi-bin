// STATIC generic methods: `%C.static:m%n` module functions — direct calls
// on the class name, inheritance through the chain, pinned values, and the
// generic-class family owning them (statics are instantiation-independent
// by tsc's own rule).
class S {
  static id<T>(x: T): T {
    return x;
  }
  static join<A, B>(a: A, b: B): string {
    return `${String(a)}+${String(b)}`;
  }
}
class SubS extends S {}

console.log(S.id(10) - 1);
console.log(S.id("s"));
console.log(S.join(1, "x"));
// Inherited static generic through the subclass name.
console.log(SubS.id("via-sub"));

// Pinned VALUES name an instance (the generic-function value rule).
const f: (x: number) => number = S.id;
console.log(f(5));
function apply(g: (s: string) => string): string {
  return g("arg");
}
console.log(apply(S.id));

// A generic CLASS's static generic method lives on the family — one
// storage/declaration for every instantiation.
class Holder<T> {
  v: T;
  constructor(v: T) {
    this.v = v;
  }
  static lift<U>(u: U): string {
    return `lift:${String(u)}`;
  }
}
console.log(Holder.lift(1));
console.log(Holder.lift("z"));
console.log(new Holder("h").v);
