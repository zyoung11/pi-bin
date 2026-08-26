// Deeply nested compositions through the dynamic boundary: records in
// records, arrays of primitives at several depths, unions in record fields
// — parsed, validated, mutated, and re-stringified. Valid casts only;
// fields and JSON keys alphabetical (see 1000-json-stringify-basics.ts).

type Status = { code: number; kind: "err" } | { kind: "ok" };
type Server = { host: string; port: number; tags: string[] };
type Deploy = {
  matrix: number[][];
  replicas: number;
  server: Server;
  status: Status;
};

const wire =
  '{"matrix":[[1,0],[0,1]],"replicas":3,' +
  '"server":{"host":"prod.example.com","port":443,"tags":["edge","tls"]},' +
  '"status":{"kind":"ok"}}';
const d = JSON.parse(wire) as Deploy;

console.log(d.replicas, d.server.host, d.server.port);
console.log(d.server.tags.join("+"), d.matrix[0][0], d.matrix[1][0]);
if (d.status.kind === "ok") {
  console.log("healthy");
}

// The extracted value is fully typed: mutate and re-serialize.
d.server.tags.push("v2");
d.replicas = d.replicas + 1;
console.log(JSON.stringify(d));

// The err arm carries a payload; width tolerance applies at every level
// (note "extra" keys at two depths, absent from the types).
const failing =
  '{"extra":true,"matrix":[],"replicas":0,' +
  '"server":{"extra":1,"host":"h","port":1,"tags":[]},' +
  '"status":{"code":503,"kind":"err"}}';
const f = JSON.parse(failing) as Deploy;
if (f.status.kind === "err") {
  console.log("down with", f.status.code);
}

// Round-trip stability: stringify(parse(stringify(x))) is byte-stable.
const once = JSON.stringify(d);
const again = JSON.stringify(JSON.parse(once) as Deploy);
console.log(once === again);

// Deep nesting parses fine; a dynamic value can be held and passed around
// without ever being inspected (operations on `unknown` are compile
// errors, not runtime guesses).
JSON.parse("[[[[[[[[[[[[[[[[[1]]]]]]]]]]]]]]]]]"); // parsed, discarded
const deep = JSON.parse("[[[7]]]") as unknown;
const kept: unknown = deep;
function passThrough(u: unknown): unknown {
  return u;
}
const still = passThrough(kept);
const unwrapped = still as number[][][];
console.log(unwrapped[0][0][0]);
