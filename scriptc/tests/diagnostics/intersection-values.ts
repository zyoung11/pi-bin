// SC2008: intersection types that resolve to no runtime shape. Object-member
// intersections intern through the record path and callable hybrids map to
// '%call' records — what fences is the remainder, like a primitive part
// against an object part (inhabited only per the checker, never buildable).

// The producer has a BODY (an ambient `declare function` would compile to
// Node's ReferenceError at the call instead — the declare-erasure stance).
type Branded = number & { __brand: "id" };
function mint(): Branded {
  return 1 as Branded;
}
const kept = mint();
console.log(kept);
