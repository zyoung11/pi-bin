// Primitive prototype surfaces with a static lowering: radix-free
// toString on booleans and strings (numbers were already static), the
// digit-free toExponential() plus both toFixed() forms, hasOwnProperty
// over literal keys (number/boolean boxes own nothing; string boxes own
// "length" and their in-range indices), the trimLeft/trimRight aliases,
// includes with a position, and the element-access spelling of each —
// JS resolves x['m'](...) exactly like x.m(...). Node is the oracle.

console.log(true.toString());
var aBool = false;
console.log(aBool.toString());
console.log(1..toString());
var s = "hi";
console.log(s.toString());
console.log("  abcde ".trimLeft(), " abcde  ".trimRight());
console.log("abcde".includes("cd", 2), "abcde".includes("cd", 3), "abc".includes("c", -5), "abc".includes("", 99));

var x = 1;
console.log(x.toExponential());
console.log((1234.5678).toExponential(), (0.00001).toExponential(), (0).toExponential(), (-0).toExponential(), (-7.25).toExponential(), (1e21).toExponential(), (0 / 0).toExponential(), (1 / 0).toExponential(), (-1 / 0).toExponential());
console.log((2.5).toFixed(), (-2.5).toFixed(), (0.5).toFixed(), (1.4).toFixed(), (-0.4).toFixed(), (-0).toFixed(), (1e21).toFixed(), (0 / 0).toFixed());
const vals = [5e-324, 1.7976931348623157e308, 0.1 + 0.2, 123456789.123456789, 2 ** 53, 1e-7, 9.999999999999999e22, 0.000001, 100, 12345e6];
for (const v of vals) {
  console.log(v.toExponential(), (-v).toExponential(), v.toFixed(), (-v).toFixed());
}
console.log((1.005).toFixed(2), (1.015).toFixed(2), (2.25).toFixed(1), (-2.25).toFixed(1));
console.log((0.1 + 0.2).toFixed(17), (1e20).toFixed(2), (1e21).toFixed(100));
console.log((5e-324).toFixed(100), (-0.4).toFixed(0), (-0).toFixed(2));
console.log((1.005).toFixed(50), (1.005).toFixed(100));
const fractionDigits = 3;
const ratio = 22 / 7;
console.log(ratio.toFixed(fractionDigits), ratio.toFixed(3.9), ratio.toFixed(0 / 0), ratio.toFixed(undefined), ratio.toFixed(void 0));
const missingDigits: undefined = undefined;
console.log(ratio.toFixed(missingDigits));
function effectfulMissingDigits(): undefined {
  console.log("effectful missing digits");
  return undefined;
}
console.log(ratio.toFixed(effectfulMissingDigits()));
function formatWithOptionalDigits(value: number, digits?: number): string {
  return value.toFixed(digits);
}
console.log(formatWithOptionalDigits(ratio), formatWithOptionalDigits(ratio, 3));
function formatOptionalNumber(value: number | undefined): string | undefined {
  return value?.toFixed(1);
}
console.log(formatOptionalNumber(1.25), formatOptionalNumber(undefined));
for (const badDigits of [-1, 101, 1 / 0]) {
  try {
    console.log((1).toFixed(badDigits));
  } catch (e) {
    console.log(e instanceof RangeError, (e as Error).message);
  }
}

console.log(x.hasOwnProperty('toFixed'));
console.log(x['toExponential']());
console.log(x['toFixed'](2));
console.log(x['hasOwnProperty']('toFixed'));
console.log(true['toString']());
var str2 = "hello";
console.log(str2['charAt'](1));
console.log(str2.hasOwnProperty('charAt'), str2.hasOwnProperty('length'), str2.hasOwnProperty('4'), str2.hasOwnProperty('5'), str2.hasOwnProperty('-1'), str2.hasOwnProperty('01'), str2.hasOwnProperty('toString'));
console.log(false.hasOwnProperty('valueOf'));
