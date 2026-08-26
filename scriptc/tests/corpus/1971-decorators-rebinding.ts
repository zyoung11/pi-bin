// @tsc-decorators
// The REBINDING tier: a decorator whose return type is the class can
// replace the binding (TC39 binds the class name to the last non-undefined
// decorator return), so every reference to the name routes through the
// decoration result — bare reads, `new`, statics, instanceof, `.name`.
// Straight-line JS can only ever return the target itself here (a subclass
// declared below the class is still in its temporal dead zone while the
// decorators run), so identity-shaped chains are the whole runnable tier —
// but the compiled program must still take the VALUE paths everywhere: the
// binding is only known to hold SOME legal classval at runtime.

let seen = 0;
function identity(t: typeof Counter): typeof Counter {
  seen++;
  console.log("identity over", t.name, "#", seen);
  return t;
}
function observe(t: typeof Counter): void {
  console.log("observe", t.name);
}

@identity
@observe
@identity
class Counter {
  static total = 0;
  n: number;
  constructor(n: number) {
    this.n = n;
    Counter.total = Counter.total + n;
  }
  double(): number {
    return this.n * 2;
  }
  static report(): string {
    return "total=" + String(Counter.total);
  }
}

// Construction through the rebound name dispatches the class object's
// construct thunk (newValue) — same instances, same statics.
const a = new Counter(3);
const b = new Counter(4);
console.log("instances:", a.n, b.n, a.double(), b.double());

// Statics through the rebound name devirtualize through the VALUE rules.
console.log("total:", Counter.total, Counter.report());
Counter.total = 100;
console.log("reset:", Counter.total);

// The binding is a first-class value with one identity.
const alias = Counter;
console.log("alias:", alias === Counter, new alias(1).n, Counter.total);

// instanceof through the rebound name reads the bound class object.
console.log("instanceof:", a instanceof Counter, b instanceof Counter);

// .name through the value (the runtime class object's stored name).
console.log("name:", Counter.name, alias.name);

// A mixed chain over a hierarchy member: the value routes still answer
// for base-typed slots and cross-class flows.
class Animal {
  legs: number;
  constructor(legs: number) {
    this.legs = legs;
  }
  speak(): string {
    return "...";
  }
}
function pin(t: typeof Spider): typeof Spider {
  console.log("pin", t.name);
  return t;
}
@pin
class Spider extends Animal {
  constructor(legs: number) {
    super(legs);
  }
  speak(): string {
    return "skitter";
  }
}
const s = new Spider(8);
const asAnimal: Animal = s;
console.log("spider:", s.legs, s.speak(), asAnimal.speak(), s instanceof Animal, s instanceof Spider);
const spiderSlot: typeof Animal = Spider;
console.log("slot name:", spiderSlot.name, new spiderSlot(2).legs);
console.log("end");
