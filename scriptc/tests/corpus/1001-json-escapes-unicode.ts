// JSON string escaping and unicode, both directions — differential against
// Node. (Record fields alphabetical: see the convention note in
// 1000-json-stringify-basics.ts.)

// Stringify escapes exactly JS's set: \" \\ \n \r \t \b \f, other control
// chars as \u00XX, everything else verbatim.
console.log(JSON.stringify('quote " backslash \\ slash /'));
console.log(JSON.stringify("line\nbreak\ttab\rret"));
console.log(JSON.stringify("bell\u0007 null\u0000 unit\u001f end"));
console.log(JSON.stringify("\b\f"));

// Non-ASCII passes through raw (JS does not escape it).
console.log(JSON.stringify("héllo wörld"));
console.log(JSON.stringify("日本語"));
console.log(JSON.stringify("emoji 😀 pair"));

// Parse side: every escape form, \uXXXX BMP and surrogate pairs.
console.log(JSON.parse('"a\\"b"') as string);
console.log(JSON.parse('"back\\\\slash"') as string);
console.log(JSON.parse('"sl\\/ash"') as string);
console.log(JSON.parse('"tab\\there"') as string);
console.log(JSON.parse('"\\u0041\\u00e9\\u65e5"') as string);
console.log(JSON.parse('"\\ud83d\\ude00"') as string); // 😀 via surrogate pair
const mixed = JSON.parse('"mix \\u0031\\n2"') as string;
console.log(mixed, mixed.length);

// Escapes in object keys and values round-trip through a record.
type Msg = { text: string };
const m = JSON.parse('{"text":"a\\nb\\"c"}') as Msg;
console.log(m.text.length);
console.log(JSON.stringify(m));

// Unicode content round-trips byte-for-byte.
const u = { s: "çedille 漢字 😀" };
console.log(JSON.stringify(u));
type S = { s: string };
console.log((JSON.parse(JSON.stringify(u)) as S).s);
