// @dynamic
// The jsval→dyn crossing over a REAL package surface (the prettier
// plugins shape from the world-unification design): island values
// flowing into 'unknown' slots wrap by reference — typeof, truthiness,
// String(), and === route to the engine, the identity round trip
// answers the same engine value back, and engine scalars normalize to
// native dyn kinds at wrap time.
import { plugins, obj, scalars } from "plugstub";

// Row 1: typeof through the wrap — "object" (the retired fence box
// answered "function" here, a silent wrong answer).
const u: unknown = plugins;
console.log("typeof plugins:", typeof u);

// Rows 2-3 on a wrapped element: truthiness, String(), engine ===.
const first: unknown = plugins[0];
console.log("truthy:", first ? "yes" : "no");
const uo: unknown = obj;
console.log("str:", String(uo));
const uo2: unknown = obj;
console.log("two wraps ===:", uo === uo2, "cross ===:", uo === first);

// The identity round trip: unknown → any is the SAME engine value.
function isSamePlugins(v: any): boolean {
  return v === plugins;
}
console.log("round trip:", isSamePlugins(u));

// Engine scalars normalize at the wrap: native dyn kinds all the way.
const n: unknown = scalars.n;
const s: unknown = scalars.s;
const b: unknown = scalars.b;
const nul: unknown = scalars.nul;
const und: unknown = scalars.und;
console.log(typeof n, typeof s, typeof b, typeof nul, typeof und);
console.log(n === 5, s === "hi", b === true, nul === null, und === undefined);

// Narrowing stays representation-free over wrapped values.
console.log(Array.isArray(u), Array.isArray(uo), typeof u === "object");

// ── the routed operation set (lane dyn-routing-ops) over the REAL
// package surface. A checker-`any` local initialized from a dyn value
// STAYS dyn (the runtime-world local rule), so every use below rides
// the routed engine ops: keyed reads walk the engine object, the
// engine's own Array.prototype.flatMap runs with the callback crossing
// through the host shim (the getSupportInfo line), a dyn callee holding
// the package's parse function routes through scr_jsval_call, and the
// Object statics ask the engine.
function support(bag: unknown): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p: any = bag;
  console.log("length:", `${p.length}`);
  console.log("langs:", JSON.stringify(p[0].languages));
}
support(u);

function callParse(bag: unknown): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = bag;
  const parse = b.parsers.babel.parse;
  console.log("parse type:", typeof parse);
  const tree = parse("src-text");
  console.log("parsed:", JSON.stringify(tree));
  console.log("keys:", Object.keys(b).join(","));
  console.log("hasOwn:", Object.hasOwn(b, "options"), Object.hasOwn(b, "zzz"));
}
callParse(plugins[0]);
