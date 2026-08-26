// Boundary crossings for recursive record types: checked casts validate
// the full recursive shape (JSON input is a tree, so structural recursion
// terminates), unknown-typed slots deep-copy acyclic values, Maps hold
// recursive values, and utility-type spellings intern the same knot.
interface TreeNode { label: string; children: TreeNode[] }

// JSON.parse + checked cast: the dynCheck walker validates recursively.
const text = '{"label":"root","children":[{"label":"a","children":[]},{"label":"b","children":[{"label":"b1","children":[]}]}]}';
const parsed = JSON.parse(text) as TreeNode;

function labels(n: TreeNode): string {
  let out = n.label;
  for (const c of n.children) out += "," + labels(c);
  return out;
}
console.log(labels(parsed));

// Round trip through unknown (an ACYCLIC value deep-copies in; the cast
// walks it back out).
const u: unknown = parsed;
const back = u as TreeNode;
console.log(labels(back));

// Maps of recursive records.
const byLabel = new Map<string, TreeNode>();
byLabel.set("root", parsed);
byLabel.set("first", parsed.children[0]);
const hit = byLabel.get("first");
console.log(byLabel.size, hit !== undefined ? hit.label : "?");

// Arrays of recursive records + reduce (the walker idiom).
function count(n: TreeNode): number {
  return n.children.reduce((acc, c) => acc + count(c), 1);
}
console.log(count(parsed));

// A recursive shape through a mapped utility type (Partial).
type SelfP = Partial<{ next: SelfP; v: number }>;
const sp: SelfP = { v: 1, next: { v: 2, next: { v: 3 } } };
function total(p: SelfP): number {
  let sum = p.v ?? 0;
  if (p.next !== undefined) sum += total(p.next);
  return sum;
}
console.log(total(sp));

// Union of two DIFFERENT recursive records, narrowed by discriminant.
interface Section { kind: "section"; title: string; parts: Doc[] }
interface Para { kind: "para"; text: string }
type Doc = Section | Para;
const doc: Doc = {
  kind: "section",
  title: "top",
  parts: [
    { kind: "para", text: "one" },
    { kind: "section", title: "inner", parts: [{ kind: "para", text: "two" }] },
  ],
};
function render(d: Doc): string {
  if (d.kind === "para") return d.text;
  let out = d.title + "(";
  for (const p of d.parts) out += render(p) + ";";
  return out + ")";
}
console.log(render(doc));

// JSON.stringify round-trips the recursive shape.
console.log(JSON.stringify(parsed) === text);
