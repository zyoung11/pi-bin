// Records with STRING index signatures: hybrid shapes — declared fields
// keep struct slots, undeclared keys live in an overflow map. Covers
// literal construction with overflow keys, dynamic reads/writes hitting
// BOTH declared fields and the overflow, typed (`Record<string, T>`) and
// `unknown`-valued signatures, declared-only dynamic reads, and reference
// semantics. JSON key order here is arranged so scriptc's documented
// declared-canonical-then-overflow order coincides with Node's insertion
// order (the divergence is exercised in SEMANTICS.md's terms, not here).

// The pricing-table shape: optional declared fields + unknown values.
interface Pricing {
  input?: string;
  output?: string;
  [key: string]: unknown;
}

const p: Pricing = { input: "1.50" };
if (p.input !== undefined) console.log("declared:", p.input);
console.log("absent:", p.output === undefined);

// Dynamic writes: overflow keys, then a declared collision (valid type).
p["web_search"] = "0.01";
p["image"] = 42;
p["flag"] = true;
const dyn = "out" + "put";
p[dyn] = "3.00";
if (p.output !== undefined) console.log("written-through:", p.output);

// Dynamic reads via checked casts: declared and overflow, hit and miss.
const key = "web_" + "search";
console.log("overflow-read:", p[key] as string);
console.log("declared-read:", p["input"] as string | undefined !== undefined);
const miss = p["nope"] as string | undefined;
console.log("miss:", miss === undefined);
console.log("num:", (p["image"] as number) + 1, "bool:", p["flag"] as boolean);

// Overwrites are last-write-wins, insertion position preserved.
p["web_search"] = "0.02";
console.log("overwritten:", p["web_search"] as string);

// Typed value signatures: Record<string, string> / Record<string, number>.
const bag: Record<string, string> = { alpha: "a" };
bag["beta"] = "b";
console.log("bag:", bag["alpha"], bag["beta"]);
const counts: Record<string, number> = {};
counts["x"] = 1;
counts["x"] = counts["x"] + 41;
console.log("counts:", counts["x"]);

// Reference semantics: records alias, mutations visible everywhere.
const alias = counts;
alias["y"] = 7;
console.log("aliased:", counts["y"], counts === alias);

// Declared-only shapes: dynamic reads over a closed key set.
type Modality = "text" | "image" | "video";
const DEFAULTS: Record<Modality, string> = { image: "img", text: "gpt", video: "vid" };
function pick(m: Modality): string {
  return DEFAULTS[m];
}
console.log("pick:", pick("text"), pick("image"), pick("video"));

// Index-signature records as union arms (`Pricing | undefined`) narrow via
// the unit test, and optional chains produce undefined on the unit path.
function maybe(flag: boolean): Pricing | undefined {
  return flag ? p : undefined;
}
const got = maybe(true);
if (got !== undefined) console.log("narrowed:", got.input !== undefined);
const hitChain = maybe(true)?.["web_search"] as string | undefined;
const missChain = maybe(false)?.["web_search"] as string | undefined;
console.log("chains:", hitChain !== undefined ? hitChain : "none", missChain === undefined);

// Bare undefined stored under an unknown signature: the key exists, JSON
// drops it (Node's rule), and it reads back as undefined.
p["ghost"] = undefined;
console.log("ghost:", (p["ghost"] as string | undefined) === undefined);

// Records/arrays as overflow values under `unknown`: deep dyn conversion.
interface Meta {
  tags: string[];
  [key: string]: unknown;
}
const m: Meta = { tags: ["a", "b"] };
m["extra"] = { level: 3, name: "deep" };
m["list"] = [1, 2, 3];
const extra = m["extra"] as { level: number; name: string };
console.log("deep:", extra.level, extra.name);
const list = m["list"] as number[];
console.log("list:", list.length, list[0], list[2]);
