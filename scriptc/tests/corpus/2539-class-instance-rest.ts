// @transform-types
// Rest properties over CLASS-INSTANCE sources: the remaining instance
// FIELDS pack into a fresh record — never the prototype members
// (methods and accessors stay behind, exactly JS's CopyDataProperties
// over own enumerable properties) — in declarations and assignments,
// with Node's key order and freshness.
class Point {
  x = 1;
  y = 2;
  z = 3;
  norm(): number {
    return this.x + this.y + this.z;
  }
  get sum(): number {
    return this.norm();
  }
}
const { x, ...restXY } = new Point();
console.log(x, restXY.y, restXY.z);
console.log(JSON.stringify(restXY), Object.keys(restXY).join(","));

// Methods and getters never join the rest object.
const p2 = new Point();
const { y, ...others } = p2;
console.log(y, JSON.stringify(others));

// The copy is fresh: writes through it never reach the instance.
others.x = 99;
console.log(p2.x, others.x);

// Renamed siblings consume their SOURCE field.
const { z: depth, ...flat } = new Point();
console.log(depth, JSON.stringify(flat));

// Inherited fields join the rest (base fields enumerate first, like
// Node's property-creation order).
class Tagged extends Point {
  tag = "t";
}
const { tag, ...coords } = new Tagged();
console.log(tag, JSON.stringify(coords));

// Constructor-assigned and parameter-property fields are instance
// fields too.
class Sized {
  readonly unit: string;
  constructor(public w: number, public h: number) {
    this.unit = "px";
  }
}
const { unit, ...dims } = new Sized(4, 5);
console.log(unit, JSON.stringify(dims));

// Assignment position packs identically.
let keep = 0;
let restAssign: { y: number; z: number } = { y: 0, z: 0 };
({ x: keep, ...restAssign } = new Point());
console.log(keep, JSON.stringify(restAssign));
