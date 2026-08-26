// encodeURIComponent / decodeURIComponent — the static URI component
// codecs (str.encodeUriComponent / str.decodeUriComponent), ECMA-exact
// over UTF-8 strings. Node is the oracle: unreserved set, uppercase hex,
// multibyte round trips, the empty-reserved-set ASCII decodes, and the
// URIError throws (bad hex, truncated escapes, overlong/surrogate/
// out-of-range sequences) — caught and reported, plus one uncaught shape
// exercised via the catch-all print below.

// encode: unreserved passthrough (identity fast path)
console.log(encodeURIComponent("AZaz09-_.!~*'()"));
// encode: the component reserved set DOES escape (unlike encodeURI)
console.log(encodeURIComponent("a b;c/d?e:f@g&h=i+j$k,l#m"));
// encode: control bytes, quotes, brackets
console.log(encodeURIComponent('<>"{}|\\^[]`\n\t'));
// encode: 2-, 3-, 4-byte UTF-8 (é, €, 💩)
console.log(encodeURIComponent("é€💩"));
// encode: empty
console.log(JSON.stringify(encodeURIComponent("")));

// decode: round trips
console.log(decodeURIComponent(encodeURIComponent("hello world & friends=100%")));
console.log(decodeURIComponent(encodeURIComponent("é€💩 mixed ascii")));
// decode: lowercase hex, plain passthrough, raw non-ASCII beside escapes
console.log(decodeURIComponent("a%2fb%2Fc"));
console.log(decodeURIComponent("no escapes at all"));
console.log(decodeURIComponent("mix é %C3%A9 raw"));
// decode: every ASCII escape decodes (empty component reserved set)
console.log(decodeURIComponent("%23%3F%2F%3A%40%26%3D%2B%24%2C"));

// decode failures: each throws URIError("URI malformed")
const bad = ["%", "%2", "%zz", "%C3", "%C3x", "%C3%2F", "%E0%80%80", "%ED%A0%80", "%F4%90%80%80", "%FF", "%80"];
for (const b of bad) {
  try {
    console.log("unexpected ok", decodeURIComponent(b));
  } catch (e) {
    console.log((e as Error).name, (e as Error).message);
  }
}
