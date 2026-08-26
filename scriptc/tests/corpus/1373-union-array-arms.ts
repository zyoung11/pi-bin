// Arrays as union arms, with the empty-literal construction: `[]` in a
// `T[] | undefined` slot builds the union's single array arm and wraps.
// Covers initializers, assignments, call arguments, returns, record fields,
// narrowing back out (unit tests + truthiness), and JSON round-trips.

const empty: string[] | undefined = [];
if (empty !== undefined) console.log("init", empty.length);

let tags: string[] | undefined = undefined;
console.log("pre", tags === undefined);
tags = [];
if (tags !== undefined) {
  tags[tags.length] = "a";
  tags[tags.length] = "b";
  console.log("assigned", tags.length, tags[0], tags[1]);
}

function count(xs: number[] | undefined): number {
  if (xs === undefined) return -1;
  let sum = 0;
  for (const x of xs) sum += x;
  return sum;
}
console.log("count", count(undefined), count([]), count([1, 2, 3]));

function pick(flag: boolean): string[] | undefined {
  if (!flag) return undefined;
  return [];
}
const picked = pick(true);
console.log("picked", picked !== undefined ? picked.length : -1);
console.log("missed", pick(false) === undefined);

interface Entry {
  id: string;
  refs?: string[];
}
const withRefs: Entry = { id: "a", refs: ["x", "y"] };
const bare: Entry = { id: "b" };
const emptied: Entry = { id: "c", refs: [] };
function show(e: Entry): void {
  if (e.refs === undefined) console.log(e.id, "none");
  else console.log(e.id, e.refs.length);
}
show(withRefs);
show(bare);
show(emptied);
console.log(JSON.stringify(withRefs), JSON.stringify(bare), JSON.stringify(emptied));

const parsed = JSON.parse('{"id":"p","refs":[]}') as Entry;
console.log("parsed", parsed.id, parsed.refs === undefined ? -1 : parsed.refs.length);
const absent = JSON.parse('{"id":"q"}') as Entry;
console.log("absent", absent.id, absent.refs === undefined);

// Truthiness over the union: arrays are JS objects — [] is truthy.
const maybe: number[] | undefined = [];
console.log("truthy", maybe ? "yes" : "no");
