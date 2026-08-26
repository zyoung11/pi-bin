// RC stress for the dynamic boundary, aimed at the sanitized lane
// (SCRIPTC_SAN=1: ASan + the runtime RC audit): dyn trees built and dropped in
// loops, typed values extracted through checked casts, parse failures
// unwinding through catch, dyn values flowing through calls and locals,
// stringify allocating under pressure. Valid casts only (see
// 1002-json-parse-cast.ts); fields/keys alphabetical.

type Entry = { id: number; name: string; tags: string[] };

function make(i: number): string {
  return (
    '{"extra":{"deep":[[1],[2,3]],"note":"dropped by the cast"},' +
    '"id":' +
    i +
    ',"name":"n' +
    i +
    '","tags":["a","b","c"]}'
  );
}

let sum = 0;
let chars = 0;
for (let i = 0; i < 200; i = i + 1) {
  // Parse + validate + extract; the checked-dynamic tree (including the "extra" subtree the
  // type ignores) dies at statement end, the record lives on.
  const e = JSON.parse(make(i)) as Entry;
  sum = sum + e.id + e.tags.length;

  // Dynamic values held in locals and passed through calls; some are
  // extracted, others just dropped (the whole dyn must free either way).
  const held: unknown = JSON.parse('{"o":[{"v":1},{"v":2}]}');
  const relay = (u: unknown): unknown => u;
  const strs = relay(JSON.parse('["x","y"]')) as string[];
  chars = chars + strs[0].length + strs[1].length;
  // Relayed twice, re-erased with `as unknown`, then dropped: the whole
  // dyn (object → array → objects) must release when the loop iteration's
  // bindings die.
  const dropped = relay(relay(held)) as unknown;
  if (i < 0) {
    console.log(JSON.stringify(dropped as number)); // never runs
  }

  // Parse failures unwind through the checked-dynamic tree mid-build; catch recovers.
  try {
    JSON.parse('{"a":[1,2,{"b":"c"},'); // dies mid-object
    sum = -1;
  } catch {
    sum = sum + 1;
  }

  // Stringify round-trips allocate and release heavily.
  const s = JSON.stringify(e);
  const back = JSON.parse(s) as Entry;
  chars = chars + JSON.stringify(back.tags).length;
}
console.log(sum, chars);

// Exceptions carrying on past dynamic values: a throw AFTER extraction
// releases the extracted record on the unwind path.
function extractThenThrow(raw: string): number {
  const e = JSON.parse(raw) as Entry;
  if (e.id > 1) {
    throw "too big: " + e.id;
  }
  return e.id;
}
let caught = 0;
for (let i = 0; i < 20; i = i + 1) {
  try {
    caught = caught + extractThenThrow(make(i));
  } catch {
    caught = caught + 100;
  }
}
console.log(caught);
