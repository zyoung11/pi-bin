// Runtime REFERENCE CYCLES through recursive record types: children
// pointing back at ancestors. Reference counting alone cannot free these;
// the cycle collector must — the sanitized lane's RC audit is the proof
// (this program leaks nothing).
interface TreeNode { label: string; children: TreeNode[] }

function makeCycle(tag: string): TreeNode {
  const parent: TreeNode = { label: "p" + tag, children: [] };
  const child: TreeNode = { label: "c" + tag, children: [] };
  parent.children.push(child);
  child.children.push(parent); // the back edge closes the cycle
  return parent;
}

// Churn: many dead cycles, none reachable after the loop.
let survivors = 0;
for (let i = 0; i < 200; i++) {
  const p = makeCycle(String(i));
  if (p.children.length === 1) survivors += 1;
}
console.log(survivors);

// A live cycle read through both directions, then dropped before exit.
const ring = makeCycle("live");
console.log(ring.label, ring.children[0].label);
console.log(ring.children[0].children[0] === ring);

// Self-loop: a node whose child is itself.
const solo: TreeNode = { label: "solo", children: [] };
solo.children.push(solo);
console.log(solo.children[0] === solo, solo.children[0].label);
