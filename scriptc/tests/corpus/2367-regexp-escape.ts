// RegExp.escape (ES2025): syntax characters take a backslash, a leading
// ASCII alphanumeric hex-escapes, other punctuators / whitespace / line
// terminators hex- or control-escape, everything else passes through —
// and the escaped text matches itself literally under new RegExp.
console.log(RegExp.escape("a.b"));
console.log(RegExp.escape("The Quick Brown Fox"));
console.log(RegExp.escape("(*.*)"));
console.log(RegExp.escape("2 dollars, 50 cents"));
console.log(RegExp.escape(""));
console.log(RegExp.escape("^$\\.*+?()[]{}|/"));
console.log(RegExp.escape(",-=<>#&!%:;@~'`\""));
console.log(RegExp.escape("\t\n\v\f\r \u00a0\u1680\u2000\u2005\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"));
console.log(RegExp.escape("ü\u{1D306}é café"));
console.log(RegExp.escape("Zz09"));
const needle = "price: $5.00 (50% off?)";
const re = new RegExp(RegExp.escape(needle));
console.log(re.test(`the ${needle} deal`), re.test("price: $5x00 (50% off?)"));
const dyn: string = ["a-b", "*star*", "9lives"][2]!;
console.log(RegExp.escape(dyn));
