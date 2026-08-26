// Generates number-formatting test cases with Node as the oracle.
// Each line: <16 hex digits of the double's bit pattern>\t<String(value)>
//
//   node gen-number-cases.mjs cases          # 50k deterministic cases → stdout
//   node gen-number-cases.mjs fuzz <count>   # <count> random cases → stdout
import { argv, stdout } from "node:process";

const f64 = new Float64Array(1);
const u64 = new BigUint64Array(f64.buffer);

function line(x) {
  f64[0] = x;
  return `${u64[0].toString(16).padStart(16, "0")}\t${String(x)}\n`;
}

function* curated() {
  yield* [
    0, -0, 1, -1, 0.5, 0.1, 0.2, 0.3, 0.1 + 0.2, 2 / 3, 1 / 3,
    NaN, Infinity, -Infinity,
    Number.MAX_VALUE, Number.MIN_VALUE, -Number.MAX_VALUE, -Number.MIN_VALUE,
    Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1, Number.MAX_SAFE_INTEGER + 2,
    Number.EPSILON, 2.2250738585072014e-308, // smallest normal
    9007199254740993, 123456789012345678, 1.7976931348623155e308,
    5e-324, 1e21, 1e-7, 1e-6, 999999999999999999999, 1000000000000000000000,
    0.000001, 0.0000001, 123.456, 3.141592653589793, 2.718281828459045,
    // %e/strtod tie-breaking nasties
    5e-1, 5e1, 35, 8.5, 1.5e300, 6.34e-8, 4.35e-9,
  ];
  // decimal-exponent boundary sweep: d × 10^e around the notation switches
  for (let e = -10; e <= 25; e++) {
    for (const d of [1, 2, 5, 9, 1.5, 9.99]) yield d * 10 ** e;
  }
  // powers of 2 and their neighbors across the full range
  for (let e = -1074; e <= 1023; e += 7) {
    const x = 2 ** e;
    yield* [x, -x, x * (1 + Number.EPSILON), x * (1 - Number.EPSILON / 2)];
  }
  // integers near digit-length transitions
  for (let d = 1; d <= 21; d++) {
    const x = 10 ** d;
    yield* [x - 1, x, x + 1];
  }
}

// xorshift128 — deterministic so the committed file is reproducible
function makeRng(seed) {
  let s0 = seed ^ 0x9e3779b97f4a7c15n, s1 = 0x2545f4914f6cdd1dn;
  return () => {
    let x = s0;
    const y = s1;
    s0 = y;
    x ^= (x << 23n) & 0xffffffffffffffffn;
    s1 = x ^ y ^ (x >> 17n) ^ (y >> 26n);
    return (s1 + y) & 0xffffffffffffffffn;
  };
}

function* random(count, seed) {
  const next = makeRng(seed);
  let emitted = 0;
  while (emitted < count) {
    u64[0] = next();
    yield f64[0];
    emitted++;
  }
}

const mode = argv[2] ?? "cases";
let chunk = "";
function emit(x) {
  chunk += line(x);
  if (chunk.length > 1 << 16) {
    stdout.write(chunk);
    chunk = "";
  }
}

if (mode === "cases") {
  for (const x of curated()) emit(x);
  for (const x of random(50_000, 0x7357cafen)) emit(x);
} else if (mode === "fuzz") {
  const count = Number(argv[3] ?? 1_000_000);
  const seed = BigInt(Date.now());
  for (const x of random(count, seed)) emit(x);
} else {
  throw new Error(`unknown mode: ${mode}`);
}
stdout.write(chunk);
