// toLowerCase()/toUpperCase() are STATIC now (no @dynamic): ECMA-262
// Default Case Conversion via the vendored libunicode tables — the same
// algorithm the engine used when these were island-backed, linked like a
// regex literal. Node (ICU) is the oracle: simple mappings, 1:many
// special casing, context-sensitive final sigma, astral case pairs, and
// case-less scripts must all agree byte-for-byte.
const s = "  Hello, World  ";
console.log(s.toUpperCase() + "|", s.toLowerCase() + "|");

// ASCII round trips.
console.log("MIXED case Words".toLowerCase(), "mixed CASE words".toUpperCase());

// 1:many special casing: ß upper-cases to SS (length grows).
console.log("straße".toUpperCase(), "straße".toUpperCase().length);
// İ (U+0130) lower-cases to i + combining dot above (two code points).
const dottedI = "İstanbul".toLowerCase();
console.log(dottedI, dottedI.length, dottedI.charCodeAt(0), dottedI.charCodeAt(1));
// ﬁ ligature upper-cases to FI.
console.log("ﬁnal".toUpperCase());

// Context-sensitive Greek final sigma: word-final Σ becomes ς, medial σ.
console.log("ΣΊΣΥΦΟΣ".toLowerCase());
console.log("ΟΔΟΣ ΟΔΟΣ".toLowerCase());
console.log("Σ".toLowerCase(), "ΑΣ".toLowerCase(), "Σ2".toLowerCase());

// Astral case pairs (Deseret): supplementary-plane mappings.
const deseret = "\u{10437}\u{10437}";
const upper = deseret.toUpperCase();
console.log(upper, upper.length, upper.charCodeAt(0));
console.log("\u{1040F}".toLowerCase() === "\u{10437}");

// Cyrillic, Greek, and accents.
console.log("Привет МИР".toLowerCase(), "привет мир".toUpperCase());
console.log("Café ÀÉÎÕÜ".toLowerCase(), "café àéîõü".toUpperCase());

// Case-less content is untouched; empty string stays empty.
console.log("日本語 123 —".toUpperCase(), "".toLowerCase() + "|");

// Composes with the rest of the string surface, statically.
const words = "alpha beta gamma";
console.log(words.toUpperCase().indexOf("BETA"), words.slice(6, 10).toUpperCase());
let label: string;
if ((label = "Port").toLowerCase() === "port") {
  console.log("guard:", label);
}
