// JSON.parse returns `unknown` (a dynamic value); a checked cast
// (`as Config`) validates it against the type and extracts a typed value.
// This corpus file exercises VALID casts only — under Node the cast is a
// no-op and behavior is identical, so the differential harness applies.
// (Invalid casts THROW in scriptc where Node silently proceeds — the
// documented headline divergence; that behavior is covered scriptc-only in
// tests/harness/dyncheck.test.ts and the runtime C tests.)
//
// Record fields alphabetical (stringify-parity convention, see
// 1000-json-stringify-basics.ts).

// Primitives.
console.log(JSON.parse("42") as number);
console.log(JSON.parse("-2.5e2") as number);
console.log(JSON.parse("true") as boolean, JSON.parse("false") as boolean);
console.log(JSON.parse('"hi"') as string);

// A config record, with WIDTH TOLERANCE: the JSON carries extra keys the
// type doesn't declare ("comment", "retries") — they are ignored by the
// check, exactly like reading only declared fields in JS.
type Config = { debug: boolean; host: string; port: number };
const raw =
  '{"comment":"ignored","debug":false,"host":"example.com","port":8080,"retries":3}';
const cfg = JSON.parse(raw) as Config;
console.log(cfg.host, cfg.port, cfg.debug);

// Typed extraction is a REAL record: field writes, identity, passing around.
cfg.port = cfg.port + 1;
console.log(cfg.port);
const alias = cfg;
console.log(alias === cfg);

// Arrays of primitives, including nested arrays.
const nums = JSON.parse("[1,2.5,3e2]") as number[];
console.log(nums.length, nums[0], nums[1], nums[2]);
const grid = JSON.parse("[[1,2],[],[3]]") as number[][];
console.log(grid.length, grid[0][1], grid[2][0]);
const names = JSON.parse('["a","b"]') as string[];
console.log(names.join(","));

// `unknown` is a first-class value: it stores in locals, passes as
// arguments, returns from functions — and only a checked cast unwraps it.
function parseIt(text: string): unknown {
  return JSON.parse(text);
}
function unwrap(u: unknown): number {
  return u as number;
}
const boxed: unknown = parseIt("7");
console.log(unwrap(boxed) + 1);

// `as unknown` on an unknown value stays erasure; chained casts validate once.
const twice = parseIt('"chain"') as unknown as string;
console.log(twice);

// Whitespace and duplicate keys (later wins, like JS).
const dup = JSON.parse('  {  "a" : 1 , "a" : 2 }  ') as { a: number };
console.log(dup.a);
