// Zero-length matches must ADVANCE (the classic infinite-loop trap), and
// under /u the advance steps over whole surrogate pairs (AdvanceStringIndex).
console.log("aaa".replace(/a*/g, "-"));
console.log("abc".replace(/(?:)/g, "."));
console.log("banana".replace(/a*/g, "<$&>"));

// Astral-plane subjects with /u: indices and advancement are UTF-16-exact.
console.log("😀x".replace(/(?:)/gu, "-"));
console.log("a😀b".split(/(?:)/u).length);
console.log("😀😀".replace(/😀/gu, "*"));
console.log("x😀y".replace(/😀/u, "[$`|$']"));

// An astral character in the PATTERN, with and without /u (without, the
// pair is two units — the CESU-8 path — but a paired match is identical).
console.log(/😀/u.test("a😀b"), /😀/.test("a😀b"), /😀/.test("ab"));
console.log("a😀b".replace(/😀/, "-"));

// Astral subject lengths through split by a BMP separator.
const parts = "😀,🎉,✨".split(/,/);
console.log(parts.length, parts[0], parts[2]);

// charCodeAt-style exactness: the match position in code units via $`.
console.log("😀z".replace(/z/, "($`)"));
