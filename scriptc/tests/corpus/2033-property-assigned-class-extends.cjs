// Property-assigned class-expression chains (the typeFromPropertyAssignment
// family, CJS-member spellings): `exports.X = class {}` and
// `module.exports.Y = class {}` are class DECLARATIONS — extends chains
// through the properties, super calls, instance fields, instanceof, and
// construction through both spellings all resolve like named classes.
exports.A = class {
  constructor() {
    this.tag = "a";
  }
  greet() {
    return "A";
  }
};
exports.B = class extends exports.A {
  greet() {
    return "B>" + super.greet();
  }
};
exports.C = class extends exports.B {
  constructor() {
    super();
    this.extra = 3;
  }
  greet() {
    return "C>" + super.greet();
  }
};
const c = new exports.C();
console.log(c.greet(), c.tag, c.extra);
console.log(c instanceof exports.A, c instanceof exports.B, c instanceof exports.C);

// The module.exports spelling of the same member attachment resolves to
// the SAME bindings (exports aliases module.exports).
module.exports.I = class {
  ping() {
    return "I";
  }
};
module.exports.O = class extends module.exports.I {
  ping() {
    return "O>" + super.ping();
  }
};
const o = new module.exports.O();
console.log(o.ping(), o instanceof module.exports.I, new exports.I() instanceof module.exports.I);
