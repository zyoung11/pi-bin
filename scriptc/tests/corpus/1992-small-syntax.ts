// @transform-types
// Small-syntax residue: old-style type assertions (<T>x — as-cast's twin),
// void expressions (statement position, void arrow bodies, pure operands
// as undefined values), array-literal elisions, and type-world
// declarations in statement position.

// <T>x mirrors `x as T` everywhere: erasure on same-type casts, literal
// widening, checked union-arm extraction.
const n = <number>3;
const s = <string>("con" + "cat");
console.log("assert num:", n + 1, "str:", s.length);

const mixed: (number | string)[] = [1, "two", 3];
const first = <number>mixed[0];
console.log("arm extract:", first + 10);

// (A LYING <T> assertion throws the checked-extraction TypeError exactly
// like `as` — divergence 38's stance, deliberately not in this
// Node-byte-exact corpus.)

// Old-style assertion feeding an assignment target position and nested
// inside expressions.
const doubled = <number>n * 2;
console.log("doubled:", doubled);

// void: statement position evaluates for effect...
let effects = 0;
function bump(): number {
  effects = effects + 1;
  return effects;
}
void bump();
console.log("effects after stmt void:", effects);

// ...a void-returning arrow with a `void e` body evaluates e and returns
// nothing...
const fire = (tag: string) => void bump();
fire("x");
console.log("effects after arrow void:", effects);

// ...and a PURE operand is just undefined (the classic void 0).
const u: string | undefined = void 0;
console.log("void 0 is undefined:", u === undefined);

// Elisions materialize the undefined arm: reads, length, join, and
// stringification agree with Node.
const holes: (number | undefined)[] = [1, , 3];
console.log("holes:", holes.length, holes[1] === undefined, holes.join(","));
const headHole = [, 5];
console.log("head hole:", headHole.length, headHole[0] === undefined);

// Interfaces and type aliases inside blocks/functions are type-world.
{
  interface Pair {
    a: number;
    b: number;
  }
  const p: Pair = { a: 2, b: 3 };
  console.log("block iface:", p.a + p.b);
}
function sum(): number {
  type Row = { v: number };
  interface Boxed {
    row: Row;
  }
  const x: Boxed = { row: { v: 40 } };
  return x.row.v + 2;
}
console.log("fn types:", sum());

// The `in` operator: static membership over unions of fixed record
// shapes (tag dispatch — tsc narrows the branches), numeric-literal keys
// over arrays (a dense length test), and side-effect-free literal
// receivers folding in place.
type HasA = { a: number };
type HasB = { b: string };
function pickSide(c: HasA | HasB): string {
  if ("a" in c) {
    return "A:" + c.a;
  }
  return "B:" + c.b;
}
console.log(pickSide({ a: 4 }));
console.log(pickSide({ b: "hi" }));
const either: HasA | HasB = { a: 1 } as HasA | HasB;
console.log("d in:", "d" in either, "| a,b:", "a" in either, "b" in either);
type HasAC = { a: number; c: boolean };
function hasA(x: HasA | HasB | HasAC): boolean {
  return "a" in x;
}
console.log("multi-arm:", hasA({ b: "q" }), hasA({ a: 1, c: true }));
console.log("array in:", 3 in [0, 1], 1 in [0, 1], 0 in [], 1.5 in [1, 2, 3]);
console.log("literal recv:", "a" in { a: true }, "b" in { a: true });
const foldedKey = "x";
console.log("template key:", `${foldedKey}` in { x: 1 });
