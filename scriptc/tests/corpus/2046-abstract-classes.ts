// @transform-types
// Abstract classes and members: an abstract class is a class nothing
// constructs directly (tsc enforces at compile time — no runtime check
// exists or is needed); abstract methods/accessors are type-world
// signatures whose vtable slot exists and is filled by subclasses (tsc
// guarantees every instantiable class implements them). Calls through
// abstract-typed receivers are ordinary virtual dispatch. `implements`
// clauses are pure type-world and lower to nothing.
import { inspect } from "node:util";

// Abstract methods: virtual dispatch through abstract-typed receivers,
// sibling implementations, concrete methods calling abstract ones.
abstract class Shape {
  constructor(public name: string) {}
  abstract area(): number;
  abstract scaled(f: number): number;
  describe(): string {
    return `${this.name}=${this.area()}`;
  }
}
class Square extends Shape {
  constructor(private side: number) {
    super("sq");
  }
  area(): number {
    return this.side * this.side;
  }
  scaled(f: number): number {
    return this.area() * f;
  }
}
class Circle extends Shape {
  constructor(private r: number) {
    super("circ");
  }
  area(): number {
    return 3 * this.r * this.r;
  }
  scaled(f: number): number {
    return this.area() * f;
  }
}
const shapes: Shape[] = [new Square(4), new Circle(2)];
for (const s of shapes) {
  console.log(s.describe(), s.area(), s.scaled(2), s instanceof Shape, s instanceof Square);
}

// Multi-level chains: abstract redeclaring abstract, overrides below the
// first implementation, dispatch from every static-type altitude.
abstract class A {
  abstract m(): string;
}
abstract class B extends A {
  abstract m(): string;
  viaB(): string {
    return `B(${this.m()})`;
  }
}
class C extends B {
  m(): string {
    return "c";
  }
}
class D extends C {
  m(): string {
    return "d";
  }
}
const asA: A[] = [new C(), new D()];
for (const a of asA) console.log(a.m());
const asB: B = new D();
console.log(asB.viaB(), (new C() as B).viaB());

// Abstract accessors: get/set pairs through abstract-typed receivers.
abstract class Cfg {
  abstract get value(): number;
  abstract set value(v: number);
  bump(): void {
    this.value = this.value + 1;
  }
}
class Live extends Cfg {
  private v = 10;
  get value(): number {
    return this.v;
  }
  set value(x: number) {
    this.v = x;
  }
}
const cfg: Cfg = new Live();
cfg.value = 41;
cfg.bump();
console.log(cfg.value);

// Statics, static blocks, and fields on abstract classes; subclasses
// inherit the constructor (synthesized forwarding through the abstract
// base's ctor).
abstract class Registry {
  static count = 0;
  static {
    console.log("registry static block");
  }
  entries: string[] = [];
  constructor(public tag: string) {
    Registry.count = Registry.count + 1;
  }
  abstract kind(): string;
  add(e: string): void {
    this.entries.push(e);
  }
}
class FileRegistry extends Registry {
  kind(): string {
    return `file:${this.tag}`;
  }
}
const fr = new FileRegistry("main");
fr.add("a");
fr.add("b");
console.log(fr.kind(), Registry.count, inspect(fr));

// Abstract subclass of Error: runtime base + abstract member dispatch,
// instanceof through the whole chain, catch typing.
abstract class CodedError extends Error {
  abstract code(): number;
  render(): string {
    return `${this.message}#${this.code()}`;
  }
}
class NotFound extends CodedError {
  constructor() {
    super("nope");
  }
  code(): number {
    return 404;
  }
}
const err: CodedError = new NotFound();
console.log(err.render(), err instanceof Error, err instanceof CodedError, err instanceof NotFound);
try {
  throw new NotFound();
} catch (e) {
  if (e instanceof CodedError) console.log("caught", e.code());
}

// `implements` erases: classes implementing interfaces are ordinary
// classes (fields, methods, construction, inspect all unchanged).
interface Named {
  name: string;
  greet(): string;
}
interface Counted {
  count: number;
}
class Person implements Named, Counted {
  count = 0;
  constructor(public name: string) {}
  greet(): string {
    this.count = this.count + 1;
    return `hi ${this.name}`;
  }
}
const person = new Person("Ada");
console.log(person.greet(), person.greet(), inspect(person));

// Generic abstract classes: instantiations carry the abstract member
// slots; concrete subclasses pin the type arguments.
abstract class Store<T> {
  constructor(protected items: T[]) {}
  abstract label(): string;
  size(): number {
    return this.items.length;
  }
}
class NumStore extends Store<number> {
  label(): string {
    return `nums(${this.size()})`;
  }
}
const ns = new NumStore([1, 2, 3]);
console.log(ns.label(), ns.size());
