// replace: first match without /g, every match with it; replaceAll needs /g.
console.log("a.b.c".replace(/\./, "-"));
console.log("a.b.c".replace(/\./g, "-"));
console.log("a.b.c".replaceAll(/\./g, "-"));

// No match: the string comes back unchanged.
console.log("abc".replace(/z/, "!"), "abc".replace(/z/g, "!"));

// Case-insensitive global.
console.log("Bob bobs BOBBING".replace(/bob/gi, "rob"));

// Multiline: ^ after every line break.
console.log("one\ntwo\nthree".replace(/^/gm, "> "));

// Dotall crossing a newline.
console.log("a\nb".replace(/a.b/s, "*"));

// Sticky: anchored at position 0 (no lastIndex state exists here).
console.log("bab".replace(/b/y, "X"), "abb".replace(/b/y, "X"));

// Sticky + global: consecutive matches from the start, stops at the gap.
console.log("bbab".replace(/b/gy, "X"));

// replaceAll without /g throws Node's TypeError — catchable.
let caught = "no";
try {
  "abc".replaceAll(/b/, "x");
  caught = "unreachable";
} catch {
  caught = "caught";
}
console.log(caught);

// Alternation + quantifiers over a longer subject.
const text = "the year 1969 and the year 2001";
console.log(text.replace(/\d+/g, "N"), text.replace(/\d+/, "N"));
