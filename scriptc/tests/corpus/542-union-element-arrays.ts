// Union-element arrays: plain arm values wrap on the way in (literals,
// push, element writes), unit-arm tests and discriminants narrow on the
// way out, and reads narrowed by the checker extract the arm value.
type Num = number | string;
const mixed: Num[] = [1, "two", 3];
mixed.push("four");
mixed.push(5);
mixed[0] = "one"; // plain arm write wraps

let text = "";
let sum = 0;
for (const v of mixed) {
  // no typeof narrowing here — string arms carry a marker instead
  if (v === "one" || v === "two" || v === "four") text += "|";
  else if (v === 3 || v === 5) sum += 10;
}
console.log(text, sum, mixed.length);

// undefined-armed elements: presence tests narrow reads
interface Hit {
  score: number;
  word: string;
}
const maybe: (Hit | undefined)[] = [
  { score: 2, word: "yes" },
  undefined,
  { score: 5, word: "also" },
];
let total = 0;
let misses = 0;
for (const h of maybe) {
  if (h !== undefined) total += h.score;
  else misses += 1;
}
console.log(total, misses);

// literal-index reads narrow too (tsc narrows a[0] like an identifier)
if (maybe[1] === undefined) console.log("hole at 1");
if (maybe[2] !== undefined) console.log(maybe[2].word);

// discriminated record arms in element position
type Ev =
  | { at: number; kind: "open" }
  | { kind: "close"; why: string };
const evs: Ev[] = [
  { at: 1, kind: "open" },
  { kind: "close", why: "eof" },
  { at: 9, kind: "open" },
];
let opens = 0;
let reason = "";
for (const e of evs) {
  if (e.kind === "open") opens += e.at;
  else reason = e.why;
}
console.log(opens, reason);

// HOFs over union elements. filter keeps the element type — the annotation
// pins it (TS 5.5 infers a type PREDICATE for the arrow, which would narrow
// the checker's array type past what the desugared loop produces).
const flags = maybe.map((h) => (h !== undefined ? h.score : -1));
console.log(flags.join(","));
const present: (Hit | undefined)[] = maybe.filter((h) => h !== undefined);
console.log(present.length);
