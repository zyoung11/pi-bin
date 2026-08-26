// @dynamic
// for-of/destructuring over wrapped ENGINE values (lane
// dom-jsval-long-tail): a package-minted array, Set, Map, generator, and
// Symbol.iterator implementation enter `unknown[]` slots as JSVAL-kind
// dyns, and the checked-dynamic iteration pack's JSVAL arm drains the
// engine's OWN iterator protocol — stepping exactly as Node runs them,
// elements wrapping back scalar-normalized. A non-iterable engine value
// throws V8's for-of spelling.
import { iterables } from "plugstub";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const b: any = iterables;

function nums(it: unknown[]): void {
  const seen: string[] = [];
  for (const x of it) seen.push(`${x}`);
  console.log(`list ${seen.join("+")}`);
  const [first, second] = it;
  console.log(`destr ${first} ${second}`);
}
nums(b.list);

function strs(it: unknown[], tag: string): void {
  for (const s of it) console.log(`${tag} ${s}`);
}
strs(b.set, "set");
strs(b.mintGen(), "gen");
strs(b.custom, "custom");

function pairs(it: unknown[]): void {
  for (const pair of it) {
    const [k, v] = pair as unknown[];
    console.log(`map ${k} ${v}`);
  }
}
pairs(b.map);

function bad(it: unknown[]): void {
  try {
    for (const x of it) console.log(x);
  } catch (err) {
    if (err instanceof Error) console.log(`caught: ${err.message}`);
  }
}
bad(b.notIterable);
