// encodeURIComponent / encodeURI — ECMA-262 Encode() statically: the
// spec's unescaped sets (encodeURI keeps the reserved set and '#'),
// uppercase %XX over UTF-8 bytes, multi-byte and astral characters
// included. The lib accepts number|boolean for encodeURIComponent —
// ToString first, like Node.
const cases = ["abc", "a b&c=d", "héllo/wörld?", "€𝒳✓", "-_.!~*'()", ";,/?:@&=+$#", "line\nbreak\ttab", ""];
for (const c of cases) {
  console.log(encodeURIComponent(c));
  console.log(encodeURI(c));
}
console.log(encodeURIComponent(42));
console.log(encodeURIComponent(true));
const query = [["a b", "1&2"], ["c", "d=e"]].map((kv) => `${encodeURIComponent(kv[0]!)}=${encodeURIComponent(kv[1]!)}`).join("&");
console.log(query);
