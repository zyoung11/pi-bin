// `u instanceof Uint8Array` on an `unknown` value: a runtime test of the
// dyn's bytes kind, with tsc's narrowing typing the true branch (reads
// bridge through the validated extraction). Buffer IS a Uint8Array in Node
// and rides the same bytes kind here, so both worlds answer true for it.
// The stdin toBytes(chunk: unknown) pattern.

function toBytes(chunk: unknown): Uint8Array {
  if (typeof chunk === "string") return new TextEncoder().encode(chunk);
  if (chunk instanceof Uint8Array) return new Uint8Array(chunk);
  return new TextEncoder().encode(String(chunk));
}

const fromString = toBytes("hey");
console.log(fromString.length, fromString[0]);

const src = new Uint8Array([104, 105, 33]);
const viaBytes = toBytes(src);
console.log(viaBytes.length, viaBytes[0], viaBytes[1], viaBytes[2]);

const viaBuffer = toBytes(Buffer.from("hi"));
console.log(viaBuffer.length, viaBuffer[0], viaBuffer[1]);

const viaNumber = toBytes(42);
console.log(viaNumber.length);

// The bare test as a value over every dyn kind, and negated flow.
const u: unknown = src;
const un: unknown = 7;
const us: unknown = "hi";
const uu: unknown = undefined;
const ul: unknown = null;
console.log(u instanceof Uint8Array);
console.log(un instanceof Uint8Array);
console.log(us instanceof Uint8Array);
console.log(uu instanceof Uint8Array);
console.log(ul instanceof Uint8Array);
if (!(u instanceof Uint8Array)) {
  console.log("not bytes");
} else {
  console.log("bytes", u.length);
}

// Narrowed reads through a helper: length summed over mixed unknowns.
function bytesLen(v: unknown): number {
  if (v instanceof Uint8Array) return v.length;
  return 0;
}
console.log(bytesLen(new Uint8Array([1, 2, 3])) + bytesLen("str") + bytesLen(5) + bytesLen(Buffer.from("ab")));
