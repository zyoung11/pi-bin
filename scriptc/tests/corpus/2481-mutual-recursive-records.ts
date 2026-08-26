// Mutually recursive record types: the knot passes through TWO shapes and
// an optional-field union (A -> B[] -> a?: A). Both intern as named
// recursive shapes; the optional back edge is an undefined-armed union.
interface A { b: B[] }
interface B { a?: A }

const inner: A = { b: [{}] };
const outer: A = { b: [{ a: inner }, {}] };

function countB(a: A): number {
  let n = 0;
  for (const b of a.b) {
    n += 1;
    if (b.a !== undefined) n += countB(b.a);
  }
  return n;
}
console.log(countB(inner));
console.log(countB(outer));

// The back edge assigns after construction too — a genuine runtime
// reference cycle (collected by the cycle collector; see the RC-audit
// lane). Traversals here stay acyclic on purpose.
const b0: B = {};
const a0: A = { b: [b0] };
b0.a = a0;
console.log(b0.a === a0, a0.b[0] === b0);
