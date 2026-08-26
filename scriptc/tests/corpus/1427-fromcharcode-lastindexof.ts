// String.fromCharCode (plain args, whole-array spread, ToUint16 wrapping,
// surrogate pairs) and string.lastIndexOf (UTF-16 indices), differential.
console.log(String.fromCharCode(104, 101, 121));
console.log(String.fromCharCode(0x66, 0x74, 0x79, 0x70)); // the mp4 box-tag shape
const codes = [116, 115, 110, 33];
console.log(String.fromCharCode(...codes));
console.log(String.fromCharCode(55357, 56832)); // an astral pair combines
console.log(String.fromCharCode(55357)); // a lone surrogate prints U+FFFD bytes
console.log(String.fromCharCode(65536 + 65, 65.9, -1).length); // ToUint16 wrap + truncate
console.log(String.fromCharCode(65601, 66)); // 65601 & 0xffff === 65 → "AB"
console.log(String.fromCharCode());
console.log(String.fromCharCode(0 / 0, 1 / 0).length); // NaN/Infinity → 0

const s = "abcabca";
console.log(s.lastIndexOf("a"), s.lastIndexOf("bc"), s.lastIndexOf("x"), s.lastIndexOf(""));
console.log("".lastIndexOf(""), "".lastIndexOf("a"), "aaa".lastIndexOf("aa"));
console.log("😀x😀x".lastIndexOf("x"), "😀x😀x".lastIndexOf("😀"), "héllo.png".lastIndexOf("."));
const filename = "archive.tar.gz";
const dot = filename.lastIndexOf(".");
console.log(dot, filename.slice(0, dot), filename.slice(dot + 1));
