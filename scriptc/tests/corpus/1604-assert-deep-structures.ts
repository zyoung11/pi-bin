// deepStrictEqual over composite static types — arrays, records, Maps,
// Sets, unions, and their nestings: Node's strict structural rules
// (Object.is numbers, per-element arrays, per-field records,
// SameValueZero-keyed Maps with deep values, Set membership). Failing
// deep comparisons throw catchably with Node's name/code (the rendered
// value diff in .message is a documented divergence, so this program
// checks THAT they throw, not the diff text).
import assert from "node:assert";

function throws(f: () => void): boolean {
  try {
    f();
    return false;
  } catch {
    return true;
  }
}

// Arrays.
assert.deepStrictEqual([1, 2, 3], [1, 2, 3]);
assert.deepStrictEqual([0 / 0], [0 / 0]); // NaN elements are deep-equal
assert.notDeepStrictEqual([0], [-0]); // zeros differ under Object.is
assert.notDeepStrictEqual([1, 2], [1, 2, 3]);
console.log("array mismatches throw:", throws(() => assert.deepStrictEqual([1, 2, 3], [1, 2, 4])));

// Records, nested.
interface Inner { tag: string; vals: number[] }
interface Outer { name: string; on: boolean; inner: Inner }
const o1: Outer = { name: "n", on: true, inner: { tag: "t", vals: [1, 2] } };
const o2: Outer = { name: "n", on: true, inner: { tag: "t", vals: [1, 2] } };
const o3: Outer = { name: "n", on: true, inner: { tag: "t", vals: [1, 9] } };
assert.deepStrictEqual(o1, o2);
assert.notDeepStrictEqual(o1, o3);
console.log("record mismatches throw:", throws(() => assert.deepStrictEqual(o1, o3)));

// Optional fields (undefined-armed unions inside records).
interface Opt { a: number; b?: string }
const p1: Opt = { a: 1 };
const p2: Opt = { a: 1 };
const p3: Opt = { a: 1, b: "set" };
assert.deepStrictEqual(p1, p2);
assert.notDeepStrictEqual(p1, p3);

// Maps: insertion order does not matter, keys by SameValueZero, values deep.
const m1 = new Map<string, number[]>([["a", [1]], ["b", [2, 3]]]);
const m2 = new Map<string, number[]>([["b", [2, 3]], ["a", [1]]]);
const m3 = new Map<string, number[]>([["a", [1]], ["b", [2, 4]]]);
assert.deepStrictEqual(m1, m2);
assert.notDeepStrictEqual(m1, m3);
console.log("map mismatches throw:", throws(() => assert.deepStrictEqual(m1, m3)));
const sizes = new Map<string, number[]>([["a", [1]]]);
assert.notDeepStrictEqual(m1, sizes);

// Sets: membership, order-free.
assert.deepStrictEqual(new Set([1, 2, 3]), new Set([3, 1, 2]));
assert.notDeepStrictEqual(new Set([1, 2]), new Set([1, 3]));
assert.notDeepStrictEqual(new Set(["a"]), new Set(["a", "b"]));
console.log("set mismatches throw:", throws(() => assert.deepStrictEqual(new Set(["x"]), new Set(["y"]))));

// Union-element arrays: tags AND payloads must agree.
const u1: (number | string)[] = [1, "two", 3];
const u2: (number | string)[] = [1, "two", 3];
const u3: (number | string)[] = [1, "2", 3];
assert.deepStrictEqual(u1, u2);
assert.notDeepStrictEqual(u1, u3);

// A caught deep failure still carries Node's identity.
try {
  assert.deepStrictEqual(o1, o3);
} catch (e) {
  if (e instanceof Error) {
    console.log("deep name:", e.name, "code:", `${(e as NodeJS.ErrnoException).code}`);
  }
}
// The custom message survives the not-equal deep form verbatim.
try {
  assert.notDeepStrictEqual(m1, m2, "maps agree");
} catch (e) {
  if (e instanceof Error) console.log("deep custom:", e.message);
}
console.log("done");
