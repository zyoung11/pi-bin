// Generic classes: statics are ONE storage location for every instantiation
// (JS has one class), subclasses extend concrete instantiations, and
// instantiation classvals ride the class-value machinery — identity, .name,
// construction and instanceof through values, all Node-exact.
class Counter<T> {
  static made = 0;
  static describe(): string {
    return `made=${Counter.made}`;
  }
  items: T[] = [];
  constructor(seed: T) {
    this.items.push(seed);
    Counter.made = Counter.made + 1;
  }
  get first(): T {
    return this.items[0]!;
  }
  add(v: T): number {
    return this.items.push(v);
  }
}

// Statics are shared across instantiations — one counter for all of them.
const a = new Counter(1);
const b = new Counter("x");
a.add(2);
b.add("y");
console.log(Counter.made, Counter.describe(), Counter.name);

// A subclass of a concrete instantiation is an ordinary class.
class Named extends Counter<string> {
  label: string;
  constructor(label: string) {
    super(label);
    this.label = label;
  }
  tag(): string {
    return `${this.label}:${this.items.length}`;
  }
}
const n = new Named("hi");
console.log(n.tag(), Counter.made);
console.log(n instanceof Counter, n instanceof Named, a instanceof Named, a instanceof Counter);

// Constructor-typed slots pin an instantiation classval; construction and
// instanceof through the value answer like Node (the runtime class IS
// Counter, so instanceof through the value covers the whole family).
const B: new (v: string) => Counter<string> = Counter;
const viaValue = new B("via-value");
console.log(viaValue.first, viaValue instanceof Counter, Counter.made);

// Instantiation expressions as values: identity within one instantiation,
// the family's .name, construction through the value.
const CV = Counter<number>;
console.log(CV === Counter<number>, CV.name);
const fromCV = new CV(9);
console.log(fromCV.first + 1, Counter.made);

// The subclass's own class value still answers its own instanceof.
const NB: new (label: string) => Named = Named;
const n2 = new NB("deep");
console.log(n2.tag(), n2 instanceof Named, viaValue instanceof Named);
