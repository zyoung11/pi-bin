// Recursion through a UNION: the knot enters at a union type (a JSON-like
// value alias) whose record arm carries the union in an array. The union
// interns as a named recursive union; narrowing works arm by arm.
type Tree = string | { children: Tree[] };

const t: Tree = { children: ["a", { children: ["b", "c"] }, "d"] };

function flatten(n: Tree): string {
  if (typeof n === "string") return n;
  let out = "";
  for (const c of n.children) out += flatten(c);
  return out;
}
console.log(flatten(t));
console.log(flatten("solo"));

// A linked list through an optional-flavored union field.
interface ListNode { value: number; next: ListNode | null }
const list: ListNode = { value: 1, next: { value: 2, next: { value: 3, next: null } } };
function sum(n: ListNode | null): number {
  let total = 0;
  let cur = n;
  while (cur !== null) {
    total += cur.value;
    cur = cur.next;
  }
  return total;
}
console.log(sum(list));
console.log(sum(null));
