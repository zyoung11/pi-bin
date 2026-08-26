// @dynamic
// The island engine end-to-end: arithmetic and string results come back as
// String(result), and the island's global scope persists between evals.
console.log(__island_eval("6 * 7"));
console.log(__island_eval("0.1 + 0.2"));
console.log(__island_eval("1e21"));
console.log(__island_eval("-0"));
console.log(__island_eval("0 / 0"));
console.log(__island_eval("1 / 0"));
console.log(__island_eval("true && false"));
console.log(__island_eval("'is' + 'land'"));
console.log(__island_eval("undefined"));
console.log(__island_eval("null"));
console.log(__island_eval("[1, 2, 3].map(x => x * 2).join('-')"));
console.log(__island_eval("JSON.stringify({ a: 1, b: [true, 'two'] })"));

// Globals persist across entries (one context per process).
console.log(__island_eval("var acc = 100; acc"));
console.log(__island_eval("acc = acc + 1; acc"));

// Island results are ordinary static strings: concat, methods, log args.
const answer = __island_eval("6 * 7");
const banner = "answer=" + answer + "!";
console.log(banner, banner.length, answer === "42");
