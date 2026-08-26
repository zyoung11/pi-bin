// @transform-types
// Structural width subtyping, class-instance → record: a class instance
// flowing into a record-typed slot projects its fields into a fresh record
// (divergence 305's copy stance). Read-after-project flows match Node.
class Point {
  constructor(public x: number, public y: number) {}
}

// Assignment boundary.
const p: { x: number; y: number } = new Point(3, 4);
console.log(p.x + p.y);

// Argument boundary.
function dist2(q: { x: number; y: number }): number {
  return q.x * q.x + q.y * q.y;
}
console.log(dist2(new Point(3, 4)));

// Return boundary.
function origin(): { x: number; y: number } {
  return new Point(0, 0);
}
console.log(origin().x, origin().y);

// Narrower target: extra class fields drop in the copy (JSON of the
// narrowed value shows the narrow shape — divergence 305 documents the
// drop; the read-through flows here are Node-exact).
class Tagged {
  constructor(public id: number, public tag: string) {}
}
const idOnly: { id: number } = new Tagged(7, "keep");
console.log(idOnly.id);

// A missing OPTIONAL target field completes to undefined, like the
// literal-completion rule.
const withOpt: { x: number; y: number; label?: string } = new Point(1, 2);
console.log(withOpt.label === undefined, JSON.stringify(withOpt));

// Union arm: the instance lifts into the single record arm.
const maybe: { x: number; y: number } | undefined = new Point(5, 6);
console.log(maybe !== undefined ? maybe.x + maybe.y : -1);

// Array elements project one by one.
const pts: { x: number; y: number }[] = [new Point(1, 1), new Point(2, 2)];
console.log(pts.map((q) => q.x + q.y).join(","));