// Object.fromEntries over string[][] VALUES (the env-directive idiom:
// split('=') rows). The lib types this overload `any`; the lowering answers
// the honest index-signature record — key ToPropertyKey(row[0]), value
// row[1] (undefined past the row's end, exactly Node). First insertion
// position wins for order, last value wins.
import { inspect } from "node:util";

const basic: string[][] = [["a", "b"], ["c", "d"]];
console.log(inspect(Object.fromEntries(basic)));
const dupes: string[][] = [["a", "1"], ["b", "2"], ["a", "3"]];
console.log(inspect(Object.fromEntries(dupes)));

// split('=') shapes: 'A=B=C' keeps 'B' (index 1 — the tail drops),
// 'QUX=' keeps '', a row with no '=' reads undefined at [1], and an
// EMPTY row keys ToPropertyKey(undefined) — the string 'undefined'.
const envArray = ["FOO=bar", "BAZ=a=b", "QUX=", "NOEQ"];
console.log(inspect(Object.fromEntries(envArray.map((env) => env.split("=")))));
const quoted: string[][] = [["my-key", "v"], ["ok", "w"]];
console.log(inspect(Object.fromEntries(quoted)));
console.log(inspect(Object.fromEntries([[]] as string[][])));

// The empty input renders the empty object.
const empty: string[][] = [];
console.log(inspect(Object.fromEntries(empty)));

// The 2-tuple overload keeps its own (older) lowering — the checker types
// THIS one { [k: string]: string } itself.
const tuples: [string, string][] = [["x", "1"], ["y", "2"]];
console.log(inspect(Object.fromEntries(tuples)));
