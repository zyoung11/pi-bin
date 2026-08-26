// parseInt, static (no island): radix forms (explicit, omitted, 0, the
// 0x escape), JS whitespace, signs, partial parses, no-digit NaN, -0's
// sign, u64-exceeding digit strings (correctly rounded where the spec
// requires: 2/4/8/10/16/32), V8's documented approximation radixes
// (35/36 — Node is the oracle bit-for-bit), and overflow to Infinity.
console.log(parseInt("42"), parseInt("  42  "), parseInt("\t\n-17"), parseInt("+99"));
console.log(parseInt("3.9"), parseInt("1e3"), parseInt("12abc"), parseInt("abc12"));
console.log(parseInt(""), parseInt(" "), parseInt("-"), parseInt("z!"));
console.log(parseInt("0x1F"), parseInt("0X1f"), parseInt("-0x20"), parseInt("0x"), parseInt("08"), parseInt("079"));
console.log(parseInt("ff", 16), parseInt("0x1A", 16), parseInt("101", 2), parseInt("777", 8));
console.log(parseInt("z", 36), parseInt("Z", 36), parseInt("hello", 30), parseInt("42", 0));
console.log(parseInt("ff", 1), parseInt("ff", 37), parseInt("ff", -1), parseInt("11", 2.9));
console.log(parseInt("11", 0 / 0), parseInt("11", Infinity), parseInt("ff", 4294967312));
console.log(parseInt("-0"), 1 / parseInt("-0"), parseInt("0000"), parseInt("-0000", 8));
console.log(parseInt("9007199254740993"), parseInt("18446744073709551617"));
console.log(parseInt("123456789012345678901234567890"), parseInt("9".repeat(40)));
console.log(parseInt("deadbeefdeadbeefdeadbeefdeadbeef", 16), parseInt("1".repeat(80), 2));
console.log(parseInt("7".repeat(30), 36), parseInt("1".repeat(80), 35), parseInt("z".repeat(25), 36));
console.log(parseInt("1" + "0".repeat(308)), parseInt("1" + "0".repeat(309)), parseInt("-1" + "0".repeat(400)));
console.log(parseInt("0".repeat(50) + "7"), parseInt("１２３"), parseInt("١٢٣"));
// Results are plain numbers, chainable through static arithmetic.
const port = parseInt("8080", 10);
console.log(port + 1, isNaN(parseInt("nope", 10)));
