// @dynamic
// Static regexes inside a --dynamic build: one libregexp serves both (the
// engine archive's copy — its host hooks route through the island's
// context), so regex results and island results must interleave exactly.
const cleaned = "Hello, World!".replace(/[^\w\s]/g, "");
console.log(cleaned);
console.log(__island_eval("'Hello, World!'.replace(/[^\\w\\s]/g, '')"));

const words = "a-b_c d".split(/[-_\s]/);
console.log(words.length, words.join("+"));

console.log(/^\d+$/.test("2024"), "v1.2.3".toUpperCase(), /\./g.source);
