// Recursive record types: a self-referential interface maps to a named
// recursive shape (the mu-type knot) instead of fencing — trees build,
// traverse, mutate, and reduce exactly like Node.
interface TreeNode { label: string; children: TreeNode[] }

const leafA: TreeNode = { label: "a", children: [] };
const leafB: TreeNode = { label: "b", children: [] };
const mid: TreeNode = { label: "mid", children: [leafA, leafB] };
const root: TreeNode = { label: "root", children: [mid, { label: "c", children: [] }] };

function count(n: TreeNode): number {
  let total = 1;
  for (const c of n.children) total += count(c);
  return total;
}

function labels(n: TreeNode): string {
  let out = n.label;
  for (const c of n.children) out += "," + labels(c);
  return out;
}

function depth(n: TreeNode): number {
  let deepest = 0;
  for (const c of n.children) {
    const d = depth(c);
    if (d > deepest) deepest = d;
  }
  return deepest + 1;
}

console.log(count(root));
console.log(labels(root));
console.log(depth(root));

// Mutation through the recursive field: grafting a subtree.
mid.children.push({ label: "d", children: [{ label: "e", children: [] }] });
console.log(count(root), labels(root), depth(root));

// Recursive values flow through arrays, params, and returns like any
// other record.
function collect(n: TreeNode, into: TreeNode[]): TreeNode[] {
  into.push(n);
  for (const c of n.children) collect(c, into);
  return into;
}
const all = collect(root, []);
console.log(all.length);
let joined = "";
for (const n of all) joined += n.label;
console.log(joined);

// Reference equality is pointer identity, exactly Node.
console.log(root.children[0] === mid, leafA === leafB);
