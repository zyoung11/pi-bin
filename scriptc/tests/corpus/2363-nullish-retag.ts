// `??` whose DEFAULT changes the result union — the `x ?? null` config
// pattern (`const seed = loaded?.config ?? null` types `T | null` from a
// `T | undefined` left): every non-unit arm re-wraps into the result
// union through the interned %nullish.retag helper. The default is a
// literal (effect-free — the helper pre-evaluates it where JS is lazy;
// effectful defaults keep the fence).
interface Loaded {
  config: { a: number };
  source: string;
}

function get(x: number): Loaded | undefined {
  return x > 0 ? { config: { a: x }, source: `file${x}` } : undefined;
}

for (const n of [2, 0]) {
  const loaded = get(n);
  // record | undefined → null | record
  const seedConfig = loaded?.config ?? null;
  // string | undefined → null | string
  const configSource = loaded?.source ?? null;
  console.log(seedConfig === null ? "no-config" : `a=${seedConfig.a}`);
  console.log(configSource === null ? "no-source" : configSource);
}

// number | undefined → null | number, both orders of use.
function pick(u: number | undefined): number | null {
  return u ?? null;
}
const p1 = pick(7);
const p2 = pick(undefined);
console.log(p1 === null ? "null" : String(p1), p2 === null ? "null" : String(p2));

// A wider left: string | number | undefined → null | string | number
// (several non-unit arms re-tag).
function w(v: string | number | undefined): string | number | null {
  return v ?? null;
}
const wa = w("s");
const wb = w(3);
const wc = w(undefined);
console.log(typeof wa === "string" ? wa : "?", typeof wb === "number" ? String(wb) : "?", wc === null ? "null" : "?");

// null-armed left with an undefined default: null | boolean → boolean | undefined.
function flip(v: boolean | null): boolean | undefined {
  return v ?? undefined;
}
const f1 = flip(true);
const f2 = flip(null);
console.log(f1 === undefined ? "undefined" : String(f1), f2 === undefined ? "undefined" : String(f2));
