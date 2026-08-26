// PROPERTY and ELEMENT targets in destructuring assignment: class
// fields, record fields, accessor setters, array elements (runtime
// indices), tuple positions, rest into members, defaults on member
// targets — and JS's evaluation order (each target's receiver evaluates
// at its pattern position, before that element's value read).
class Point {
  x = 0;
  y = 0;
}
const pt = new Point();
[pt.x, pt.y] = [3, 4];
console.log(pt.x, pt.y);

const rec = { a: 0, b: 0 };
({ first: rec.a, second: rec.b } = { first: 11, second: 22 });
console.log(rec.a, rec.b);

// Accessor SETTERS are targets (the write calls the setter).
class Boxed {
  private inner = 0;
  set value(v: number) {
    this.inner = v * 2;
  }
  get value(): number {
    return this.inner;
  }
}
const bx = new Boxed();
[bx.value] = [21];
console.log(bx.value);

// Array elements with runtime indices, tuple positions with literals.
const cells = [0, 0, 0];
let i = 2;
[cells[i], cells[0]] = [30, 10];
console.log(cells.join(","));

const tup: [number, string] = [0, ""];
[tup[0], tup[1]] = [5, "five"] as [number, string];
console.log(tup[0], tup[1]);

// Rest into a member target.
const holder: { tail: number[] } = { tail: [] };
let head = 0;
[head, ...holder.tail] = [1, 2, 3, 4];
console.log(head, holder.tail.join(","));

// Defaults on member targets fire exactly on undefined.
const sparse: { m?: number; n?: number } = { n: 9 };
({ m: pt.x = -7, n: pt.y = -8 } = sparse);
console.log(pt.x, pt.y);

// Receivers evaluate left to right, at their element's position.
const log: string[] = [];
function pick(tag: string): Point {
  log.push(tag);
  return pt;
}
[pick("L").x, pick("R").y] = [100, 200];
console.log(log.join("<"), pt.x, pt.y);
