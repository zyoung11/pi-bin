// @tsc-decorators
// Class decorators, the effect-only (void-returning) tier: TC39 evaluation
// order — decorator expressions in SOURCE order (factories run here), then
// applications in REVERSE order over the class object, then static field
// initializers and static blocks — plus registries of class values, static
// mutation through the decorator's parameter (the leaf-class write), and
// the untouched direct paths (new, statics, instanceof, .name fold) when
// no decorator can rebind the name. The Node side runs tsc's ES2022
// downlevel (V8 has not shipped decorator syntax).

class Base {
  v: number;
  constructor(v: number) {
    this.v = v;
  }
  kind(): string {
    return "base";
  }
}

// A registry decorator: class values are first-class — the decorator's
// side effect mutates OTHER storage (the array), the common real shape.
const registry: (typeof Base)[] = [];
function register(t: typeof Base): void {
  registry.push(t);
}

// A factory: `@logged("x")` calls logged at expression-evaluation time and
// applies the RETURNED decorator later.
function logged(label: string): (t: typeof Widget) => void {
  console.log("factory", label);
  return (t: typeof Widget) => {
    console.log("apply", label, t.name);
  };
}

// A stats-mutating decorator: writes through the class-value parameter hit
// the leaf class's own static storage (no subclasses can flow in).
function stamp(t: typeof Widget): void {
  t.stamped = true;
  console.log("stamp", t.name, t.stamped);
}

@logged("outer")
@register
@stamp
@logged("inner")
class Widget extends Base {
  static stamped = false;
  static count = 0;
  static {
    console.log("static block:", Widget.name, "stamped:", Widget.stamped);
  }
  kind(): string {
    return "widget";
  }
}

// stamped is FALSE here: the static field initializer ran AFTER the
// decorators (TC39 order) and overwrote stamp's write — both worlds agree.
console.log("after class:", Widget.stamped, Widget.count);
console.log("registered:", registry.length, registry[0] === Widget);

// The direct paths stay direct: no decorator can rebind Widget.
const w = new Widget(7);
console.log("instance:", w.v, w.kind(), w instanceof Widget, w instanceof Base);
console.log("name:", Widget.name, "base name:", Base.name);
Widget.count = 3;
console.log("count:", Widget.count);

// Decoration runs whether or not anything references the class — the
// registry observes the unreferenced declaration.
function silent(t: typeof Ghost): void {
  console.log("ghost decorated:", t.name);
}
@silent
class Ghost {}

// Multiple decorators on one line, expression order vs application order.
function tag(n: number): (t: typeof Multi) => void {
  console.log("make", n);
  return (t: typeof Multi) => console.log("run", n);
}
@tag(1) @tag(2) @tag(3)
class Multi {}

// Decoration interleaves with ordinary module statements at the class
// statement's position.
console.log("end");
