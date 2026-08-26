// Every string method, ASCII receivers: happy paths, out-of-bounds,
// fractional indices (ToIntegerOrInfinity), negative indices, empty needles.
// Surrogate-splitting charAt/slice and invalid repeat counts are documented
// divergences and live in the runtime's own C tests, not here.
const s: string = "hello world";

// .length
console.log(s.length, "".length, " ".length);

// charCodeAt: exact code units, fractional index truncates, OOB → NaN
console.log(s.charCodeAt(0), s.charCodeAt(10), s.charCodeAt(1.9));
console.log(s.charCodeAt(-1), s.charCodeAt(11), s.charCodeAt(0 / 0));

// charAt: 1-char string, OOB → empty string (prints as nothing between pipes)
console.log(s.charAt(0), s.charAt(6), s.charAt(10.5));
console.log("|" + s.charAt(-1) + "|" + s.charAt(99) + "|");

// indexOf: hits, misses, fromIndex (negative clamps to 0, past-end → -1),
// empty needle returns the clamped fromIndex
console.log(s.indexOf("o"), s.indexOf("o", 5), s.indexOf("o", 8));
console.log(s.indexOf("hello"), s.indexOf("world"), s.indexOf("worlds"));
console.log(s.indexOf("l", -3), s.indexOf("l", 100), s.indexOf("zz"));
console.log(s.indexOf(""), s.indexOf("", 4), s.indexOf("", 100));

// includes / startsWith / endsWith (empty needle is always true)
console.log(s.includes("lo wo"), s.includes("xyz"), s.includes(""));
console.log(s.startsWith("hell"), s.startsWith("ello"), s.startsWith(""));
console.log(s.endsWith("rld"), s.endsWith("worl"), s.endsWith(""));

// slice: no args, start only, both, negatives, both-negative, start>end,
// fractional, and far-out-of-range clamping
console.log(s.slice(), s.slice(6), s.slice(0, 5), s.slice(3, 8));
console.log(s.slice(-5), s.slice(-5, -2), s.slice(2, -2), s.slice(-100, 4));
console.log(s.slice(8, 2), s.slice(5, 5), s.slice(100), s.slice(0, 100));
console.log(s.slice(1.9, 4.2), s.slice(-2.5));

// repeat: 0 → "", fractional truncates, NaN → 0
console.log("ab".repeat(3), "x".repeat(0), "no".repeat(2.9), "n".repeat(0 / 0));
console.log("|" + "".repeat(5) + "|");

// trim: JS WhiteSpace set on both ends, all-whitespace, no-op
console.log("\t\n  padded   　".trim(), "|" + " \t ".trim() + "|", "clean".trim());

// results feed conditions, arithmetic, equality
if (s.includes("world") && !s.startsWith("world")) {
  console.log("guarded", s.indexOf("world") * 2 + s.length);
}
console.log(s.slice(0, 5) === "hello", s.charAt(4) === s.charAt(2 + 2));

// chained calls and methods on expression results
console.log(s.slice(1, 4).repeat(2).trim());
console.log((s + "!").endsWith("d!"), ("  " + s.slice(6) + "  ").trim().length);
console.log(s.slice(s.indexOf("w"), s.length - 1).repeat(2));

// methods on template-literal results
const name: string = "scriptc";
console.log(`${name} v${1}`.slice(0, name.length).endsWith("ive"));
console.log(`  ${name.charAt(0).repeat(3)}  `.trim());

// receiver via function return, results through calls
function shout(t: string): string {
  return t.slice(0, 1).repeat(3) + t.slice(1);
}
console.log(shout("bang"), shout(s.slice(6)));
