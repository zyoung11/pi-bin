// JSON round-trips of index-signature records: stringify includes overflow
// keys (declared canonical order first, then overflow insertion order —
// programs here CONSTRUCT in that order so Node's insertion-order output
// coincides byte-for-byte), parse-casts CAPTURE undeclared keys into the
// overflow (width capture, not the plain-record width tolerance), and
// undefined-valued entries drop like Node.

interface Pricing {
  input?: string;
  output?: string;
  [key: string]: unknown;
}

// Stringify: declared (canonical: input, output) then overflow insertion.
const p: Pricing = { input: "1", output: "2" };
p["cache_read"] = "0.1";
p["cache_write"] = "0.2";
console.log(JSON.stringify(p));

// Optional declared field holding undefined drops; overflow undefined drops.
const q: Pricing = { input: "1" };
q["web_search"] = "0.3";
q["ghost"] = undefined;
console.log(JSON.stringify(q));

// Nested values stringify through the checked-dynamic tree (numbers, booleans, arrays,
// objects — JS-exact escapes and number formatting).
const r: Pricing = {};
r["n"] = 1e21;
r["neg"] = -0;
r["arr"] = [1, "two", true];
r["obj"] = { a: 1 };
r["esc"] = 'quote " backslash \\ newline \n';
console.log(JSON.stringify(r));

// Parse-cast: extras are CAPTURED (readable afterwards), declared fields
// keep their static slots, and the whole thing re-stringifies.
const parsed = JSON.parse('{"input":"5","exotic":"x","deep":{"k":[1,2]}}') as Pricing;
if (parsed.input !== undefined) console.log("declared:", parsed.input);
console.log("captured:", parsed["exotic"] as string);
const deep = parsed["deep"] as { k: number[] };
console.log("deep:", deep.k.length, deep.k[1]);
console.log(JSON.stringify(parsed));

// Typed signatures round-trip too: values validate per entry.
const bag = JSON.parse('{"a":"1","b":"2"}') as Record<string, string>;
console.log(bag["a"], bag["b"], JSON.stringify(bag));
const nums = JSON.parse('{"one":1,"two":2}') as Record<string, number>;
console.log(nums["one"] + nums["two"], JSON.stringify(nums));

// Declared + typed signature: the declared field validates as its own
// type, extras as the signature's.
interface Scores {
  best: number;
  [key: string]: number;
}
const s = JSON.parse('{"best":10,"alt":7}') as Scores;
console.log(s.best, s["alt"], JSON.stringify(s));

// Empty overflow: an index-signature record with no extras stays a plain
// object in JSON both ways.
const empty = JSON.parse('{"input":"9"}') as Pricing;
console.log(JSON.stringify(empty));

// Pretty-printing rides the same serializer through the re-indenter.
const pretty: Record<string, number> = {};
pretty["a"] = 1;
console.log(JSON.stringify(pretty, null, 2));
