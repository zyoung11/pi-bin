// #private instance methods: lexically bound, per-class, no dynamic dispatch — `this.#m()` and cross-instance `other.#m()` lower as DIRECT calls of the declaring class's module function (privates never enter vtables; a subclass redeclaring an inherited private name is fenced, so overrideBelow can never flip). Recursion, privates calling privates, constructor calls, and subclass instances flowing through inherited public methods all match Node byte-for-byte.
class Chain {
  #links: string[] = [];
  label: string;
  constructor(label: string, seed: string) {
    this.label = label;
    // JS installs private methods at construction start, so the ctor may
    // call them before any field initializer it declares later runs.
    this.#push(seed);
  }
  #push(link: string): number {
    this.#links.push(link);
    return this.#links.length;
  }
  #render(sep: string): string {
    return this.label + ":" + this.#links.join(sep);
  }
  #merge(other: Chain): string {
    // Cross-instance private access: the receiver is another instance of
    // the declaring class — legal exactly here, inside the class body.
    for (const l of other.#links) this.#push(l);
    return this.#render("+");
  }
  add(link: string): number {
    return this.#push(link);
  }
  show(sep: string): string {
    return this.#render(sep);
  }
  absorb(other: Chain): string {
    return this.#merge(other);
  }
}
const a = new Chain("a", "one");
a.add("two");
const b = new Chain("b", "three");
console.log(a.show("-"));
console.log(a.absorb(b));
console.log(a.show("|"));

// Recursion through a private method.
class Fib {
  #memoHits = 0;
  #calc(n: number): number {
    if (n < 2) return n;
    this.#memoHits++;
    return this.#calc(n - 1) + this.#calc(n - 2);
  }
  run(n: number): string {
    return `${this.#calc(n)}/${this.#memoHits}`;
  }
}
console.log(new Fib().run(10));

// A subclass instance through the base's public method still reaches the
// base's private method (the instance carries the brand — JS-exact).
class Base {
  #secret(): string {
    return "base-secret";
  }
  reveal(): string {
    return this.#secret();
  }
  peek(other: Base): string {
    return other.#secret().toUpperCase();
  }
}
class Derived extends Base {
  extra = 1;
}
const d = new Derived();
console.log(d.reveal());
console.log(new Base().peek(d), d.extra);

// Class EXPRESSIONS declare privates like declarations do.
const Boxed = class {
  #v: number;
  constructor(v: number) {
    this.#v = v;
  }
  #dbl(): number {
    return this.#v * 2;
  }
  out(): number {
    return this.#dbl() + 1;
  }
};
console.log(new Boxed(20).out());

// Generic private methods monomorphize per call site, dispatched
// statically like every private.
class Wrap {
  #lift<T>(v: T): T[] {
    return [v, v];
  }
  use(): number {
    const nums = this.#lift(3);
    const strs = this.#lift("ab");
    return nums[0]! + nums[1]! + strs[0]!.length + strs[1]!.length;
  }
}
console.log(new Wrap().use());
