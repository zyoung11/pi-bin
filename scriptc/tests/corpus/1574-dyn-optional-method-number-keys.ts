// The dyn optional-METHOD step and dyn NUMBER-keyed reads (the workspace
// scope-extraction shape): `rawName?.match(re)` on a JSON.parse-derived
// value short-circuits nullish receivers to undefined and runs the
// validated dynamic dispatch otherwise; `scopeMatch[1]` converts the
// number key through ToString and reads the dyn array.
function parseName(raw: string): { scope: string | null; name: string | null } {
  const pkg = JSON.parse(raw);
  const rawName = typeof pkg.name === "string" ? pkg.name : null;
  const scopeMatch = rawName?.match(/^@([^/]+)\//);
  const scope = scopeMatch ? scopeMatch[1] : null;
  const name = rawName ? rawName.replace(/^@[^/]+\//, "") : null;
  return { scope, name };
}
const a = parseName('{"name": "@acme/tool"}');
console.log(`${a.scope} ${a.name}`);
const b = parseName('{"name": "plain"}');
console.log(`${b.scope} ${b.name}`);
const c = parseName('{"other": 1}');
console.log(`${c.scope} ${c.name}`);

// Nullish receivers short-circuit past the ARGUMENTS too (lazy, like JS).
let evals = 0;
function re(): RegExp {
  evals++;
  return /x/;
}
const missing = JSON.parse('{"a":1}');
const none = (missing.nope as string | undefined)?.match(re());
console.log("short-circuit:", none === undefined, "evals:", evals);

// A kind mismatch throws V8's TypeError shape, catchably — the same
// validated dispatch the truthy-guarded spelling runs.
try {
  const n = JSON.parse('{"v": 5}');
  n.v?.match(/x/);
  console.log("unreachable");
} catch (e) {
  console.log("mismatch:", e instanceof TypeError);
}

// Number-keyed dyn reads: array elements by canonical index, out-of-range
// and non-canonical keys read as absent, and string receivers answer
// their UTF-16 code unit like JS.
const doc = JSON.parse('{"tags": ["x", "y"], "title": "abc"}');
console.log(`${doc.tags[0]} ${doc.tags[1]}`);
console.log("oob:", doc.tags[2] === undefined, doc.tags[-1] === undefined, doc.tags[0.5] === undefined);
const i = 1;
console.log("computed:", `${doc.tags[i]}`, `${doc.title[i]}`);
console.log("str-oob:", doc.title[99] === undefined);
