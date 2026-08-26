// URLSearchParams parse/serialize edges, byte-for-byte against Node's
// application/x-www-form-urlencoded: '&' splitting with empty segments
// skipped, first-'=' pair split, '+' as space, case-insensitive %XX
// decoding with malformed escapes passing through verbatim, decoded
// bytes running WHATWG UTF-8 decode-with-replacement (U+FFFD per maximal
// invalid subpart — %FF, truncated sequences, encoded surrogates), and
// the serializer's exact byte set ([A-Za-z0-9*\-._] verbatim, space →
// '+', uppercase %XX otherwise — '~' and '!' encode, '*' does not).
// Sort order is UTF-16 code units: astral pairs sort BELOW U+E000..FFFF
// where raw UTF-8 byte order would put them above.
for (const q of ["", "&", "&&", "a", "=x", "a=", "=", "a==b", "a=b=c", "%", "%2", "%2G", "%2b=%2B", "%ff=%FF", "a+b=c+d", "%41=%61", "??a=1", "a=%E2%88", "a=%ED%A0%80", "🚀=💥"]) {
  const sp = new URLSearchParams(q);
  const parts: string[] = [];
  sp.forEach((v, k) => parts.push(JSON.stringify(k) + ":" + JSON.stringify(v)));
  console.log("q " + JSON.stringify(q) + " -> " + parts.join(",") + " | " + sp.toString() + " | " + String(sp.size));
}
// The serializer over every ASCII byte (as one name and one value).
{
  const sp = new URLSearchParams();
  let s = "";
  for (let i = 1; i < 128; i++) s += String.fromCharCode(i);
  sp.append(s, s);
  console.log(sp.toString());
}
// Non-ASCII UTF-8 percent-encodes byte-wise; U+FFFD stays U+FFFD.
{
  const sp = new URLSearchParams();
  sp.append("é", "漢字");
  sp.append("𝒳", "�x");
  console.log(sp.toString());
}
// Sort: code-unit order (empty first, ASCII, astral pair, then U+FFFB).
{
  const sp = new URLSearchParams();
  sp.append("￻", "1");
  sp.append("🚀", "2");
  sp.append("", "3");
  sp.append("z", "4");
  sp.append("a", "5");
  sp.append("z", "6");
  sp.sort();
  const ks: string[] = [];
  sp.forEach((v, k) => ks.push(k + "=" + v));
  console.log(ks.join("|"));
}
// Round-trip: parse(serialize(list)) preserves the decoded pairs.
{
  const sp = new URLSearchParams();
  sp.append("a b", "c&d=e");
  sp.append("%", "100%");
  const rt = new URLSearchParams(sp.toString());
  console.log(sp.toString() === rt.toString(), JSON.stringify(rt.get("a b")), JSON.stringify(rt.get("%")));
}
