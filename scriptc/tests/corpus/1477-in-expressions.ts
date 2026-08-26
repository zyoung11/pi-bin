// `"key" in v` — the key-presence test. process.env answers via getenv(3)
// presence (empty string still present, exactly Node); record shapes answer
// type-directed: declared non-optional fields are statically true, missing
// keys statically false, and optional fields (undefined-armed unions) test
// the slot's arm at runtime. The `in`-guard idiom composes with tsc's
// narrowing as usual.

// process.env: the harness pins SCRIPTC_TEST_ENV; the unset name is false.
console.log("SCRIPTC_TEST_ENV" in process.env);
console.log("SCRIPTC_DEFINITELY_UNSET_XYZ" in process.env);
// An EMPTY value is still present — `in` is about the key, not truthiness.
process.env.SCRIPTC_EMPTY_TEST = "";
console.log("SCRIPTC_EMPTY_TEST" in process.env);
// Negated and condition positions.
if ("SCRIPTC_TEST_ENV" in process.env) console.log("guarded: present");
if (!("SCRIPTC_DEFINITELY_UNSET_XYZ" in process.env)) console.log("guarded: absent");

// Record shapes: a declared non-optional field is always present.
interface AddrInfo {
  address: string;
  family: string;
  port: number;
}
const addr: AddrInfo = { address: "192.168.1.7", family: "IPv4", port: 5353 };
console.log("address" in addr);
console.log("nope" in addr);
if ("address" in addr && addr.address !== "0.0.0.0") {
  console.log(`route: ${addr.address}`);
}

// Optional fields: presence is the slot's runtime arm.
interface Opts {
  name: string;
  label?: string;
}
function describe(o: Opts): string {
  return "label" in o ? `labeled(${o.label})` : `plain(${o.name})`;
}
console.log(describe({ name: "a" }));
console.log(describe({ name: "b", label: "shiny" }));

// The guard composes with narrowing in both orders.
interface Cfg {
  port: number;
  host?: string;
}
function hostOf(c: Cfg): string {
  return "host" in c && c.host !== undefined ? c.host : "<none>";
}
console.log(hostOf({ port: 80, host: "localhost" }));
console.log(hostOf({ port: 81 }));

// A union field WITHOUT an undefined arm is a real slot: always present.
interface Row {
  v: string | null;
}
const row: Row = { v: null };
console.log("v" in row);
