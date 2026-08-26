// TUPLE width: TS permits no arity change, so tuple→tuple coercion is
// arity-exact with per-position lifts — a position widens into a union
// arm, and nested record/tuple positions reshape (SEMANTICS.md 36's copy
// stance, applied positionally). Read-after-narrow flows only.
const t: [string, number] = ["a", 1];
const w: [string, number | string] = t;
console.log(w[0], w.length);
const second = w[1];
if (typeof second === "number") console.log(second + 1);
console.log(JSON.stringify(w));

// A position widening into an undefined-armed union.
const u: [string, number | undefined] = t;
const maybe = u[1];
if (maybe !== undefined) console.log(maybe);

// Tuples nested in record fields narrow with the record.
type Row = { pos: [number, number]; name: string };
const r: Row = { pos: [3, 4], name: "p" };
const wr: { pos: [number, number | undefined] } = r;
const y = wr.pos[1];
if (y !== undefined) console.log(y);

// Tuple positions holding RECORDS reshape per position.
type Wide = { id: string; n: number };
const pair: [Wide, string] = [{ id: "first", n: 7 }, "tail"];
const slim: [{ id: string }, string] = pair;
console.log(slim[0].id, slim[1]);

// Tuple arms inside unions: the re-tag composes with the positional lift.
function find(flag: boolean): [string, number] | undefined {
  return flag ? ["hit", 42] : undefined;
}
const found: [string, number | string] | undefined = find(true);
console.log(found === undefined ? "none" : `${found[0]}/${found[1]}`);
const missed: [string, number | string] | undefined = find(false);
console.log(missed === undefined ? "none" : "some");

// Call-argument and return flows.
function head(p: [string, number | string]): string {
  return p[0];
}
console.log(head(t));
function firstPair(): [string, number | undefined] {
  return t;
}
console.log(firstPair()[0]);
