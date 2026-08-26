// The ToNumber(string) grammar zoo — Number(aString) through the ECMA-262
// StringNumericLiteral grammar edge by edge: the full StrWhiteSpace set
// (empty/whitespace-only is +0, lookalikes are not whitespace), signed
// decimals with exponents, "Infinity" exact-case, UNSIGNED 0x/0o/0b
// (signs on those are NaN), boundary doubles (denormals, MAX_VALUE
// overflow, the 2^53 neighborhood, giant hex), and trailing garbage.
const zoo: string[] = [
  // whitespace: empty, ASCII, NBSP/BOM/Zs/line terminators, lookalikes
  "", " ", "\t\n\r\v\f", "\u00a0\ufeff", "\u2000\u2009\u202f\u205f\u3000\u1680", "\u2028\u2029",
  " 42 ", "\t7\n", "\u00a08\ufeff", "\u200b", "1\u00a02", "\u180e5",
  // decimals: signs, dots, exponents
  "42", "-42", "+42", "0", "-0", "+0", ".5", "5.", "1.", "+.5", "-.5",
  "3.14159", "1e3", "1E3", "1e+3", "1e-3", "5.e3", ".5e-3", "1e", "1e+", ".e3", ".",
  // Infinity: exact-case whole-token only
  "Infinity", "-Infinity", "+Infinity", " Infinity ", "infinity", "INFINITY", "Infinit", "Infinityy",
  // non-decimal integer literals: unsigned only, whole-span only
  "0x10", "0X1F", "0xdeadBEEF", "0o17", "0O777", "0b101", "0B11",
  "-0x10", "+0o7", "-0b1", "0x", "0o", "0b", "0xg", "0o8", "0b2", "0x1.5", " 0x11 ",
  // boundaries: 2^53 neighbors, MAX_VALUE overflow, denormal underflow, giant hex
  "9007199254740991", "9007199254740992", "9007199254740993", "9007199254740995",
  "0x1fffffffffffff", "0x20000000000000", "0x20000000000001", "0x20000000000002",
  "0xffffffffffffffff", "0xfffffffffffff800000000000000000000",
  "1.7976931348623157e308", "1.7976931348623159e308", "2e308", "-1e309",
  "5e-324", "2.5e-324", "2e-324", "1e-400", "2.2250738585072014e-308",
  // garbage: every one NaN
  "12px", "1.2.3", "1..2", "1_000", "1,000", "+-1", "1 2", "+ 1", "NaN", "nan",
  "e5", "+", "-", "true", "null", "undefined", "00x10", "\u0661\u0662\u0663",
];
for (const s of zoo) {
  // 1/x distinguishes -0 from +0 (prints -Infinity vs Infinity).
  console.log(JSON.stringify(s), Number(s), 1 / Number(s));
}

// Long-form inputs: exactness and overflow through the whole pipeline.
console.log(Number("9".repeat(100)), Number("1" + "0".repeat(309)), Number("0." + "0".repeat(100) + "1"));
console.log(Number("0x" + "f".repeat(300)), Number("0b" + "1".repeat(54)), Number("0o" + "7".repeat(400)));

// Results are ordinary doubles: arithmetic and comparisons.
const a = Number("0.1"), b = Number("0.2");
console.log(a + b, a + b === 0.3, Number("1e21") * 2, Number("  ") + 5);
