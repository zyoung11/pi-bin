// Requirer side of `module.exports = class …{}`: the binding IS the class
// — construction, instanceof, .name, statics (field and method), the
// property-attached Sub class, and `extends` over the anonymous export.
const Anon = require("./anon.cjs");
const Widget = require("./widget.cjs");

const a = new Anon(3);
console.log("require anon:", a.t, a instanceof Anon, Anon.name, Anon.label);
const s = new Anon.Sub();
console.log("require sub:", typeof s);

console.log("require widget:", Widget.name, Widget.describe(), new Widget().kind);

// A local class extending the anonymous whole-export: the require binding
// resolves like a class declaration, super calls included.
class Kid extends Anon {
  constructor() {
    super(100);
    this.grown = this.t * 2;
  }
}
const k = new Kid();
console.log("extends export:", k.t, k.grown, k instanceof Anon, k instanceof Kid);
