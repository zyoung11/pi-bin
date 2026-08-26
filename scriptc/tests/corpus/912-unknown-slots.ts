// Typed values flowing into 'unknown' slots: the dynFrom injection at the
// coercion chokepoint — initializers, params, returns, array pushes into
// unknown[] (via index-signature records), and unions with undefined arms.
// Deep-copy stance for composites (SEMANTICS.md); scalars are value-exact.

// Initializers and reassignment.
let u: unknown = 42;
console.log(u as number, typeof u === "number");
u = "text";
console.log(u as string);
u = true;
console.log(u as boolean);
u = undefined;
console.log(u === undefined);
u = null;
console.log(u === null);

// Params and returns.
function classify(v: unknown): string {
  if (typeof v === "number") return `num:${v}`;
  if (typeof v === "string") return `str:${v}`;
  if (typeof v === "boolean") return `bool:${v}`;
  if (v == null) return "nullish";
  return "other";
}
console.log(classify(7), classify("x"), classify(false), classify(undefined), classify(null));

function passthrough(v: unknown): unknown {
  return v;
}
console.log(passthrough(3.5) as number, passthrough("keep") as string);

// Records and arrays convert (deep copy) — validated extraction reads them
// back structurally intact, nested composites included.
const rec: unknown = { id: "r1", n: 2, inner: { flag: true }, list: ["a", "b"] };
const back = rec as { id: string; n: number; inner: { flag: boolean }; list: string[] };
console.log(back.id, back.n, back.inner.flag, back.list.length, back.list[1]);

const arr: unknown = [1, 2, 3];
const nums = arr as number[];
console.log(nums.length, nums[0] + nums[2]);

// Optional-flavored unions convert: the undefined arm becomes the checked-dynamic tree
// undefined; data arms convert as themselves.
function fromOptional(s: string | undefined): unknown {
  return s;
}
console.log(fromOptional("present") as string, fromOptional(undefined) === undefined);

// Mixed static/dyn flows: a JSON.parse result and an injected value meet in
// the same slot type.
const parsed: unknown = JSON.parse('{"k":1}');
const injected: unknown = { k: 1 };
console.log((parsed as { k: number }).k === (injected as { k: number }).k);
