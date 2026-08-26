// zlib deflateSync/inflateSync round trips (compressed BYTES are
// zlib-version-dependent, so only round-trip results and a fixed-blob
// inflation print — never raw deflate output), plus crypto.randomBytes as
// a real Buffer with the composed .toString path unchanged beside it.
import { randomBytes } from "node:crypto";
import { deflateSync, inflateSync } from "node:zlib";

const raw = Buffer.from("hello hello hello hello compression works", "utf8");
const packed = deflateSync(raw);
console.log("smaller", packed.length > 0, packed.length < raw.length);
console.log("header", packed[0]);
console.log("rt", inflateSync(packed).toString() === raw.toString());
console.log("rthex", inflateSync(packed).toString("hex") === raw.toString("hex"));

// A fixed blob deflated by zlib once (any zlib inflates it identically).
const fixed = Buffer.from("789c2b29ce4b2cc92c4b05000fa2036f", "hex");
console.log("fixed", inflateSync(fixed).toString());

const empty = deflateSync(new Uint8Array(0));
console.log("empty", inflateSync(empty).length);

try {
  inflateSync(Buffer.from("00112233", "hex"));
  console.log("no-throw");
} catch (e) {
  if (e instanceof Error) {
    console.log("corrupt", e.message);
  }
}
try {
  inflateSync(packed.slice(0, packed.length - 4));
  console.log("no-throw");
} catch (e) {
  if (e instanceof Error) {
    console.log("truncated", e.message);
  }
}

const r = randomBytes(16);
console.log("rand", r.length, r.byteLength);
console.log("randcopy", new Uint8Array(r).length);
console.log("rand0", randomBytes(0).length);
console.log("randtrunc", randomBytes(2.7).length);
// The composed string form stays one fused operation, identical results.
console.log("composed", randomBytes(8).toString("hex").length);
try {
  randomBytes(-1);
  console.log("no-throw");
} catch (e) {
  if (e instanceof RangeError) {
    console.log("range", e.message);
  }
}
