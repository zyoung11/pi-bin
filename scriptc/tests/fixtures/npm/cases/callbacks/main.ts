// @dynamic
// Closures crossing INTO the island (the package-callback pattern):
// arguments arrive as 'any' handles, results marshal back, and thrown
// values bridge BOTH ways — static throw → engine catch, engine throw →
// static catch — strings surviving the round trip exactly and ERROR
// OBJECTS crossing as real errors in both directions (name/message/
// String(e) byte-compared against Node).
import { describeError, repeat, throwTypeError, transform, tryCatch } from "cb";

repeat(3, (i, d) => {
  const a: number = i;
  const b: number = d;
  console.log(`${a}:${b}`);
});

const r: number = transform(20, (x) => x * 2);
console.log(r);

const msg: string = tryCatch(() => {
  throw "boom";
});
console.log(msg);

const nmsg: string = tryCatch(() => {
  throw 42;
});
console.log(nmsg);

try {
  repeat(1, () => {
    throw "kaboom";
  });
} catch {
  console.log("caught outside");
}

// A scriptc Error thrown inside the callback arrives in the package as a
// real engine Error (instanceof Error, name, message, String(e) — all
// exactly what Node's own Error gives the package).
const described: string = describeError(() => {
  throw new RangeError("host range");
});
console.log(described);
const custom: string = describeError(() => {
  const err = new Error("plain");
  err.name = "Custom";
  throw err;
});
console.log(custom);
const still: string = describeError(() => {
  throw "still a string";
});
console.log(still);

// And a package-thrown TypeError arrives OUT here as a real TypeError
// instance a typed catch narrows.
try {
  throwTypeError();
} catch (e) {
  if (e instanceof TypeError) {
    console.log("typed out", e.name, e.message);
  }
}
