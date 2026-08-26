// @transform-types
// Structural width subtyping, record → data class: a record flowing into a
// class-instance slot constructs through the class's trivial
// parameter-property constructor (divergence 305 — construction IS the
// projection; instanceof answering true where Node's plain object says
// false is the documented residue, not exercised here).
class Point {
  constructor(public x: number, public y: number) {}
}

// Assignment boundary (the namespace-class Point pattern).
const p: Point = { x: 10, y: 20 };
console.log(p.x + p.y);

// Argument boundary.
function sum(q: Point): number {
  return q.x + q.y;
}
console.log(sum({ x: 1, y: 2 }));

// Return boundary.
function make(): Point {
  return { x: 7, y: 8 };
}
console.log(make().x, make().y);

// A wider record narrows into the constructor's fields (extra fields drop
// in the copy — the width stance).
const wide = { x: 3, y: 4, label: "extra" };
console.log(sum(wide));

// Optional parameter properties: a source missing the optional field
// constructs with undefined there, exactly the absent-optional rule.
class Named {
  constructor(public name: string, public nick?: string) {}
}
const n: Named = { name: "ada" };
console.log(n.name, n.nick === undefined);
const n2: Named = { name: "grace", nick: "g" };
console.log(n2.name, n2.nick ?? "none");