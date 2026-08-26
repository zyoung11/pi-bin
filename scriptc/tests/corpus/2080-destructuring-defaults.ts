// Destructuring DEFAULTS in every declaration position: JS's one rule —
// the default fires exactly when the read value is undefined (never on
// null), lazily, left to right, with earlier bindings referenceable —
// over tuple positions (the undefined-arm test), array positions (a
// bounds test folds past-the-end into the same rule), record fields,
// nested patterns (the defaulted value destructures), fields the source
// shape does not carry (the default IS the binding), for-of heads, and
// parameter patterns (whole-pattern defaults included).
const t = (n: number): number => { console.log("eval", n); return n; };
const [a = t(1), bb = t(2)] = [undefined, 5] as [number | undefined, number];
console.log("ab", a, bb);
const [c = 1, d = c + 1] = [10] as number[];
console.log("cd", c, d);
const [z = 42] = [] as number[];
console.log("z", z);
const arr2: (number | undefined)[] = [undefined, 3];
const [u1 = 7, u2 = 8, u3 = 9] = arr2;
console.log("u", u1, u2, u3);
const [k = "zzz", v = false] = ["", true] as [string, boolean];
console.log("kv", JSON.stringify(k), v);
interface Inner { b: number }
const src1: { a?: Inner } = {};
const { a: { b } = { b: 7 } } = src1;
console.log("b", b);
const src2: { a?: Inner } = { a: { b: 1 } };
const { a: { b: b2 } = { b: 7 } } = src2;
console.log("b2", b2);
const { m: { q } = { q: 5 } } = {} as { m?: { q: number } };
console.log("q", q);
const map = new Map([["", true]]);
for (const [mk = "dflt", mv = false] of map) console.log("map", JSON.stringify(mk), mv);
for (const [e = 9] of [[1], [2], []]) console.log("forof", e);
const conf: { tld?: string; tlds?: string[] } = {};
const { tld = "localhost", tlds = [tld] } = conf;
console.log("tlds", JSON.stringify(tlds));
// May itself be undefined: the binding keeps the union.
const { maybe = undefined } = {} as { maybe?: number };
console.log("maybe", `${maybe}`);
// Parameter positions share the machinery.
function paramDefault([first = 9]: number[]): number { return first; }
console.log(paramDefault([]), paramDefault([3]));
function wholeDefault([wa, wb]: [number, number] = [1, 2]): number { return wa + wb; }
console.log(wholeDefault(), wholeDefault([10, 20]));
function objWhole({ x = 1, y = "d" }: { x?: number; y?: string } = {}): string { return `${x}:${y}`; }
console.log(objWhole(), objWhole({ x: 5 }), objWhole({ x: 2, y: "z" }));
function prepareConfig({
  additionalFiles: {
    json = []
  } = {}
}: {
  additionalFiles?: Partial<Record<"json" | "jsonc" | "json5", string[]>>;
} = {}): number {
  return json.length;
}
console.log(prepareConfig(), prepareConfig({}), prepareConfig({ additionalFiles: { json: ["a"] } }));
const arrow = ({ n }: { n: number } = { n: 9 }): number => n;
console.log(arrow(), arrow({ n: 3 }));
