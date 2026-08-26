// comptime + JSON: stringify/parse round-trips happen entirely at compile
// time (real JS JSON in the island — insertion order, exactly like Node).
type Config = { debug: boolean; port: number; tags: string[] };

const encoded = comptime(() => {
  const cfg = { debug: false, port: 8080, tags: ["alpha", "beta"] };
  return JSON.stringify(cfg);
});
console.log(encoded);

const port = comptime(() => {
  const parsed = JSON.parse('{"debug":true,"port":3000,"tags":["x","y"]}') as Config;
  return parsed.port * 2 + parsed.tags.length;
});
console.log(port);

// A full round-trip: build → stringify → parse → transform → bake.
const summary = comptime(() => {
  const wire = JSON.stringify({ items: [3, 1, 2], label: "load" });
  const back = JSON.parse(wire) as { items: number[]; label: string };
  let total = 0;
  for (const n of back.items) {
    total += n;
  }
  return back.label + ":" + total;
});
console.log(summary);

// Escapes survive stringify-at-compile-time byte-for-byte.
const escaped = comptime(() => JSON.stringify('quote " backslash \\ newline \n'));
console.log(escaped, escaped.length);
