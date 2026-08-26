// Class expressions: a class definition in expression position — the value
// has everything a declaration has (members, statics, inheritance,
// NamedEvaluation .name), and named expressions bind their own name inside
// the body.
const Point = class {
  x = 0;
  y = 0;
  constructor(x?: number, y?: number) {
    this.x = x ?? 0;
    this.y = y ?? 0;
  }
  dist2(): number {
    return this.x * this.x + this.y * this.y;
  }
};
const p = new Point(3, 4);
console.log(p.dist2(), Point.name);

// `var` binding, named expression: the DECLARED name wins over the binding.
var v = class C4 {
  foo(): string {
    return "hi";
  }
};
console.log(new v().foo(), v.name);

// Statics on class expressions: fields (writable), methods, and reads
// through the binding.
const Counter = class {
  static count = 0;
  static label = "counter";
  static bump(): number {
    Counter.count = Counter.count + 1;
    return Counter.count;
  }
};
console.log(Counter.bump(), Counter.bump(), Counter.count, Counter.label, Counter.name);

// A NAMED class expression binds its own name inside the body (Node: the
// inner binding is the class itself).
const Named = class Zed {
  self(): string {
    return Zed.name;
  }
  static who(): string {
    return "static " + Zed.name;
  }
};
console.log(new Named().self(), Named.who(), Named.name);

// Nested anonymous extends chains collect recursively; instance layout and
// initializer order are exactly the declaration story.
let C = class extends class extends class {
  a = 1;
} {
  b = 2;
} {
  c = 3;
};
const abc = new C();
console.log(abc.a, abc.b, abc.c, C.name);

// extends a NAMED program class; class expressions join the hierarchy.
class Base {
  kind(): string {
    return "base";
  }
}
const Derived = class extends Base {
  kind(): string {
    return "derived";
  }
};
const d: Base = new Derived();
console.log(d.kind(), d instanceof Base, d instanceof Derived, Derived.name);

// Anonymous in a once-evaluated expression position (no statics): the
// value still carries construction and members; .name is "".
function nameOf(K: new () => Base): string {
  return new K().kind();
}
console.log(nameOf(class extends Base {}), JSON.stringify((class extends Base {}).name));
