// Aliased strings vs the append-optimized concat: `s += x` must never
// mutate a string another binding can still observe, whatever capacity or
// reuse tricks the runtime plays. Every print pairs the appended string
// with its pre-append alias.

// The plain aliasing trap: s2 must keep the old value.
let s1 = "hello";
let s2 = s1;
s1 += " world";
console.log(s1);
console.log(s2);

// Alias snapshotted mid-loop, appends keep going after the snapshot.
let acc = "";
let snap = "";
for (let i = 0; i < 10; i++) {
  if (i === 5) {
    snap = acc;
  }
  acc += `${i}-`;
}
console.log(acc);
console.log(snap);

// Chained concat (the uniquely-owned in-place path) must leave its
// operands untouched.
const a = "aa";
const b = "bb";
const c = a + b + a + b + a;
console.log(c, a, b);

// Reads on both aliases after an append: .length, charCodeAt (exact even
// for surrogate halves) and charAt on full-character positions. Guards the
// cached UTF-16 length/cursor against the append mutating shared state.
let u = "é😀x";
const v = u;
u += "é😀x";
console.log(u.length, v.length, u.charCodeAt(4), v.charCodeAt(1), u.charAt(3), v.charAt(0));

// Self-append: both operands are the same string.
let w = "ab";
w += w;
w += w;
console.log(w);

// Descending per-character reversal (BMP-only, so charAt is exact) with an
// alias of an intermediate accumulator kept alive across further appends.
const base = "café mañana – ok";
let rev = "";
let mid = "";
for (let i = base.length - 1; i >= 0; i--) {
  rev += base.charAt(i);
  if (i === 8) {
    mid = rev;
  }
}
console.log(rev, rev.length, rev.charCodeAt(0));
console.log(mid, mid.length);

// Aliased slice/indexOf churn over the appended result: cursor cache reads
// interleaved between two views.
let hay = "";
for (let i = 0; i < 50; i++) {
  hay += "mañana 😀 ";
}
const hay2 = hay;
console.log(hay.length, hay2.slice(30, 40), hay.indexOf("😀", 100), hay2.charCodeAt(487));
