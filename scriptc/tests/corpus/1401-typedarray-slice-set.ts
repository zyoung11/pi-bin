// slice (relative indices, clamping, always a copy), subarray CONTENTS
// (scriptc subarray COPIES — a documented divergence — so no mutation
// flows through it here), and set(src, offset) with Node's RangeError.
function hex(x: Uint8Array): string {
  return Buffer.from(x).toString("hex");
}

const b = new Uint8Array([1, 2, 3, 4, 5]);
console.log("s1", hex(b.slice(-3, -1)));
console.log("s2", hex(b.slice(1.9, 3.2)));
console.log("s3", hex(b.slice(2)));
console.log("s4", hex(b.slice()));
console.log("s5", hex(b.slice(4, 2)));
console.log("s6", hex(b.slice(-99, 99)));

const sl = b.slice(0, 2);
sl[0] = 42;
console.log("copy", b[0], sl[0]);

console.log("sub", hex(b.subarray(1, 3)));
console.log("sub2", hex(b.subarray(-2)));

const dst = new Uint8Array(5);
dst.set(new Uint8Array([7, 8]), 3);
dst.set(new Uint8Array([9]));
console.log("set", hex(dst));
try {
  dst.set(new Uint8Array([1, 2, 3]), 4);
  console.log("no-throw");
} catch (e) {
  if (e instanceof RangeError) {
    console.log("range", e.message);
  } else {
    console.log("not-a-rangeerror");
  }
}
