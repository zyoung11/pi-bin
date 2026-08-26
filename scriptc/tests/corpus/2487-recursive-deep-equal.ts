// assert.deepStrictEqual over recursive record types: acyclic trees
// compare structurally; CYCLIC values terminate through the pair memo
// (a pair already being compared answers equal — Node's memoization), so
// equal cycles pass and unequal ones fail with Node's AssertionError.
import assert from "node:assert";

interface TreeNode { label: string; children: TreeNode[] }

const t1: TreeNode = { label: "r", children: [{ label: "a", children: [] }] };
const t2: TreeNode = { label: "r", children: [{ label: "a", children: [] }] };
assert.deepStrictEqual(t1, t2);
console.log("acyclic equal ok");

const t3: TreeNode = { label: "r", children: [{ label: "b", children: [] }] };
try {
  assert.deepStrictEqual(t1, t3);
} catch (e) {
  if (e instanceof Error) console.log("acyclic unequal:", e.name);
}

// The same reference is deep-equal to itself, cyclic or not.
const ring: TreeNode = { label: "ring", children: [] };
ring.children.push(ring);
assert.deepStrictEqual(ring, ring);
console.log("self ok");

// Two structurally equal self-loops.
const ring2: TreeNode = { label: "ring", children: [] };
ring2.children.push(ring2);
assert.deepStrictEqual(ring, ring2);
console.log("cycles equal ok");

// Cyclic vs different label: unequal.
const ring3: TreeNode = { label: "other", children: [] };
ring3.children.push(ring3);
try {
  assert.deepStrictEqual(ring, ring3);
} catch (e) {
  if (e instanceof Error) console.log("cycles unequal:", e.name);
}

// notDeepStrictEqual sees the same verdicts.
assert.notDeepStrictEqual(ring, ring3);
console.log("not-deep ok");
