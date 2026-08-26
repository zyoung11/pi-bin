// Bitwise operators with JS ToInt32/ToUint32 semantics: a table of edge
// doubles through every operator vs Node — NaN/±Infinity → 0, truncation
// toward zero, modular wrap at 2^32, 5-bit shift masks, >>> as Uint32.

const nan = 0 / 0;
const inf = 1 / 0;
const edges: number[] = [
  0,
  -0,
  1,
  -1,
  5,
  -5,
  3.7,
  -3.7,
  0.5,
  -0.5,
  31,
  32,
  33,
  255,
  256,
  65535,
  2147483647, // 2^31 - 1: INT32_MAX
  2147483648, // 2^31: wraps negative
  2147483649,
  -2147483648, // INT32_MIN
  -2147483649, // wraps positive
  4294967295, // 2^32 - 1
  4294967296, // 2^32: wraps to 0
  4294967297,
  8589934592, // 2^33
  9007199254740991, // 2^53 - 1
  -9007199254740991,
  1e21,
  -1e21,
  1e-7,
  nan,
  inf,
  -inf,
];

for (const a of edges) {
  console.log("~", a, "=>", ~a);
  console.log("self", a, "=>", a & a, a | a, a ^ a, a >>> 0);
}

const rhs: number[] = [0, 1, 3, 16, 31, 32, 33, 63, -1, -31, 0.9, nan, inf, -inf, 2147483648];
for (const a of edges) {
  for (const b of rhs) {
    console.log(a, "&", b, "=>", a & b);
    console.log(a, "|", b, "=>", a | b);
    console.log(a, "^", b, "=>", a ^ b);
    console.log(a, "<<", b, "=>", a << b);
    console.log(a, ">>", b, "=>", a >> b);
    console.log(a, ">>>", b, "=>", a >>> b);
  }
}

// precedence and mixing with arithmetic
console.log((1 + 2) & 3, (1 & 2) + 3, 5 & (3 | 8), (5 & 3) | 8);
console.log(~~3.7, ~~-3.7, ~~nan); // the classic double-not truncation

// compound assignments
let acc = 0xf0f0;
acc &= 0xff00;
console.log(acc);
acc |= 0x000f;
console.log(acc);
acc ^= 0xffff;
console.log(acc);
acc <<= 4;
console.log(acc);
acc >>= 2;
console.log(acc);
let wrap = -1;
wrap >>>= 0;
console.log(wrap);
let frac = 3.99;
frac |= 0;
console.log(frac);

// compound on record fields
interface Flags {
  bits: number;
}
const f: Flags = { bits: 0b1010 };
f.bits &= 0b0110;
console.log(f.bits);
f.bits <<= 3;
console.log(f.bits);

// hash-style loop: the FNV-ish pattern real code uses
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}
console.log(hashCode(""), hashCode("a"), hashCode("hello world"), hashCode("scriptc ⚙️"));
