// Array.from(aString) and [...aString] split by CODE POINTS — the string
// iterator's walk: astral characters (surrogate pairs) come back whole,
// combining marks stay separate units, empty splits empty. Both spellings
// share one lowering; both must match Node exactly.

const ascii = Array.from("abc");
console.log(ascii.length, ascii.join("|"));

const bmp = Array.from("café");
console.log(bmp.length, bmp.join("|"));

const astral = Array.from("a😀z");
console.log(astral.length, astral.join("|"));
console.log(astral[1] === "😀", (astral[1] ?? "").length);

// Combining sequence: é as e + U+0301 stays two elements (code points,
// not grapheme clusters — exactly the string iterator).
const combining = Array.from("éx");
console.log(combining.length, combining.join("|"));

const empty = Array.from("");
console.log(empty.length);

// The spread spelling lowers through the same helper.
const spread = [..."h😀!"];
console.log(spread.length, spread.join("|"));

// A computed (non-literal) source, mixed pipeline: split, transform, join.
const word: string = ["n", "a", "t", "i", "v", "e"].join("") + "😀";
const upper = [...word].map((ch) => (ch === "😀" ? ch : ch.toUpperCase()));
console.log(upper.join(""));

// Spread into a literal alongside other elements.
const mixed = ["<", ..."ab😀", ">"];
console.log(mixed.length, mixed.join(""));
