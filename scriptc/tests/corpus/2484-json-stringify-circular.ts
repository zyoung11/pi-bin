// JSON.stringify over recursive record types: acyclic values serialize
// exactly; CYCLIC values throw V8's exact "Converting circular structure
// to JSON" TypeError, message byte for byte (starting object, hop lines,
// the ellipsis rule, the closing edge).
interface TreeNode { label: string; children: TreeNode[] }

const root: TreeNode = { label: "root", children: [{ label: "kid", children: [] }] };
console.log(JSON.stringify(root));

function boom(v: TreeNode): void {
  try {
    JSON.stringify(v);
    console.log("no throw");
  } catch (e) {
    if (e instanceof TypeError) {
      console.log("TypeError");
      console.log(e.message);
    }
  }
}

// The canonical parent<->child cycle: record -> array -> record closes.
const parent: TreeNode = { label: "p", children: [] };
const child: TreeNode = { label: "c", children: [] };
parent.children.push(child);
child.children.push(parent);
boom(parent);

// Self-loop through the array.
const solo: TreeNode = { label: "solo", children: [] };
solo.children.push(solo);
boom(solo);

// A long chain (the ellipsis path: more than three hops elide the middle).
interface ListNode { next: ListNode | null }
const head: ListNode = { next: null };
let cur = head;
for (let i = 0; i < 6; i++) {
  const n: ListNode = { next: null };
  cur.next = n;
  cur = n;
}
cur.next = head;
try {
  JSON.stringify(head);
} catch (e) {
  if (e instanceof TypeError) console.log(e.message);
}

// Not-at-root detection: the cycle sits below an acyclic prefix.
const wrapper: TreeNode = { label: "w", children: [parent] };
boom(wrapper);

// A DAG is NOT a cycle: the shared subtree serializes twice, like Node.
const shared: TreeNode = { label: "s", children: [] };
const dag: TreeNode = { label: "d", children: [shared, shared] };
console.log(JSON.stringify(dag));

// Stringify still works after a circular throw (the buffer resets).
console.log(JSON.stringify(root, null, 2));
