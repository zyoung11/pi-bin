// @dynamic
// Marshaling round-trips across the island boundary, including astral-plane
// (non-BMP) characters: ScrStr storage is UTF-8, the engine speaks UTF-16
// on the surface — .length inside the island must count code units while
// the bytes coming back stay well-formed UTF-8.
const globe = "\u{1F30D}"; // 🌍, one code point, two UTF-16 code units
console.log(__island_eval("'" + globe + "'.length"));
console.log(__island_eval("'héllo ' + '" + globe + "'"));
console.log(__island_eval("'" + globe + "'.codePointAt(0).toString(16)"));
console.log(__island_eval("'" + globe + "'.charCodeAt(0)"));
console.log(__island_eval("'" + globe + "'.charCodeAt(1)"));

// Round-trip: astral string out of the island, back into static-world
// operations, and into another island eval.
const out = __island_eval("'x' + '" + globe + "' + 'y'");
console.log(out, out.length, out.charCodeAt(1), out.charCodeAt(2));
console.log(__island_eval("'" + out + "'.length"));

// Mixed multi-byte planes in one string.
console.log(__island_eval("['é', '中', '" + globe + "'].join('')"));
