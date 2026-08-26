// util.inspect over Maps and Sets: the "Map(n) { k => v }" / "Set(n) { }"
// forms, insertion-order entries, nested composite values, the 100-entry
// cap, break-length spill, and depth placeholders. Node is the oracle.
import { inspect } from "node:util";

console.log(inspect(new Map<string, number>()));
console.log(inspect(new Set<number>()));
console.log(inspect(new Map<string, number>([["a", 1]])));
console.log(inspect(new Map<string, number>([["a", 1], ["b", 2], ["c", 3]])));
console.log(inspect(new Set<number>([1, 2, 3])));
console.log(inspect(new Set<string>(["one", "two", "three"])));

// number keys, quoted-string keys
console.log(inspect(new Map<number, string>([[1, "one"], [2, "two"]])));
console.log(inspect(new Map<string, string>([["a-b", "it's"], ["k l", 'say "hi"']])));

// composite values nest through the same depth budget
console.log(inspect(new Map<string, number[]>([["xs", [1, 2]], ["ys", [3]]])));
const nested = new Map<string, { list: number[] }>([["a", { list: [1, 2, 3] }]]);
console.log(inspect(nested));

// break-length spill onto per-entry lines
const wide = new Map<string, string>();
for (let i = 0; i < 8; i++) wide.set(`key-number-${i}`, `value-number-${i}`);
console.log(inspect(wide));
const wideSet = new Set<string>();
for (let i = 0; i < 12; i++) wideSet.add(`member-string-${i}`);
console.log(inspect(wideSet));

// the 100-entry cap: "... N more items" (and the singular form)
const big = new Map<number, number>();
for (let i = 0; i < 105; i++) big.set(i, i * i);
console.log(inspect(big));
const oneOver = new Set<number>();
for (let i = 0; i < 101; i++) oneOver.add(i);
console.log(inspect(oneOver));

// depth: a Map two levels down renders [Map]
console.log(inspect({ a: { b: new Map<string, number>([["k", 1]]) } }));
console.log(inspect({ a: { b: { c: new Map<string, number>([["k", 1]]) } } }));
console.log(inspect({ a: { b: { c: new Set<number>([1]) } } }));
console.log(inspect(new Map<string, number>([["k", 1]]), { depth: -1 }));

// insertion order survives deletes
const churn = new Map<string, number>([["a", 1], ["b", 2], ["c", 3]]);
churn.delete("b");
churn.set("d", 4);
console.log(inspect(churn));
