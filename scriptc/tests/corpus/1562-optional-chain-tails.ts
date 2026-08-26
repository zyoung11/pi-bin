// Optional-chain TAILS: the `?.` short-circuits every later step of the
// chain (`x?.trim().toLowerCase()` reads nothing when x is nullish), so the
// whole tail lowers inside one guard — method steps, property steps, and
// element steps included. Nested guards (`a?.[1]?.trim()`) stay separate
// chains, composed exactly like JS.
const env: { [key: string]: string | undefined } = { A: " Hi ", B: "  wOrLd  " };
console.log(`${env.A?.trim().toLowerCase()}`);
console.log(`${env.MISSING?.trim().toLowerCase()}`);

// Property and element tails over record/array receivers.
type R = { name: string; tags: string[] };
function pick(x: boolean): R | undefined {
  return x ? { name: "N", tags: ["a", "b"] } : undefined;
}
const r = pick(true);
const s = pick(false);
console.log(`${r?.name.toUpperCase()}`, `${r?.tags[1]}`);
console.log(`${s?.name.toUpperCase()}`, `${s?.tags[0]}`);

// Argument side effects past the guard stay LAZY on the short-circuit.
let evals = 0;
function idx(): number {
  evals++;
  return 0;
}
console.log(`${s?.tags[idx()]}`, "evals:", evals);
console.log(`${r?.tags[idx()]}`, "evals:", evals);

// Longer tails chain through every intermediate step.
function maybe(x: boolean): string | undefined {
  return x ? " MiXeD " : undefined;
}
console.log(`${maybe(true)?.trim().toLowerCase().padStart(8, ".")}`);
console.log(`${maybe(false)?.trim().toLowerCase().padStart(8, ".")}`);

// Null-armed receivers short-circuit to undefined too (JS: null in, undefined out).
function nully(x: boolean): string | null {
  return x ? "YES" : null;
}
console.log(`${nully(true)?.toLowerCase().trim()}`);
console.log(`${nully(false)?.toLowerCase().trim()}`);

// NESTED guards inside one spine: each ?. is its own chain, re-guarding
// the previous step's undefined-armed result (the service-manager shape).
function m(x: boolean): string[] | null {
  return x ? [" full ", " grp "] : null;
}
const hit = m(true);
const miss = m(false);
console.log(`${hit?.[1]?.trim()}`);
console.log(`${miss?.[1]?.trim()}`);
const sparse: (string | undefined)[] = ["  pad  ", undefined];
console.log(`${sparse[0]?.trim()?.toUpperCase()}`);
console.log(`${sparse[1]?.trim()?.toUpperCase()}`);

// Deep guarded spines ending in a method tail.
type Deep = { mid?: { leaf?: string } };
function d(x: boolean): Deep | undefined {
  const v: Deep = { mid: { leaf: " L " } };
  return x ? v : undefined;
}
console.log(`${d(true)?.mid?.leaf?.trim().toLowerCase()}`);
console.log(`${d(false)?.mid?.leaf?.trim().toLowerCase()}`);

// Regex-method chain steps ride the narrowed arm too (the workspace
// scope-extraction shape): match on `string | undefined` receivers.
function name(x: boolean): string | undefined {
  return x ? "@acme/tool" : undefined;
}
const m1 = name(true)?.match(/^@([^/]+)\//);
console.log(`${m1 ? m1[1] : "none"}`);
const m2 = name(false)?.match(/^@([^/]+)\//);
console.log(`${m2 ? m2[1] : "none"}`);
const m3 = name(true)?.replace(/^@[^/]+\//, "");
console.log(`${m3}`);

// Tails in condition and coalescing positions (the cli.ts config shape).
type Cfg = { script?: string; name?: string };
type Loaded = { config: Cfg; configDir: string };
function loadConfig(x: boolean): Loaded | null {
  const cfg: Cfg = { script: "dev-script", name: "app" };
  return x ? { config: cfg, configDir: "/tmp" } : null;
}
const loaded = loadConfig(true);
const none = loadConfig(false);
console.log(loaded?.config.script ?? "dev");
console.log(none?.config.script ?? "dev");
if (loaded?.config.name) console.log("named:", loaded.config.name);
console.log("done");
