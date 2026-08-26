// npm-static pilot: the real slash package (vendored, pure ESM + own
// .d.ts) compiled STATICALLY. Byte-compared with Node.
import slash from "slash";

console.log(slash("foo\\bar\\baz"));
console.log(slash("C:\\Users\\dev\\project"));
console.log(slash("\\\\?\\C:\\extended\\path"));
console.log(slash("already/posix/path"));
console.log(slash("mixed\\and/both"));
console.log(slash(""));
