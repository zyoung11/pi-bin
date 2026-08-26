// node:querystring.parse — the grammar corners of Node's legacy scan
// (scr_qs.c's quirk-faithful port; Node is the oracle), generated as an
// input sweep: empty/keyless/valueless segments, repeated keys becoming
// arrays, '=' inside values, '+' meaning space (but '%2B' staying '+'),
// malformed percent-escapes (bad hex copies literally; valid escapes
// that decode to invalid UTF-8 take the lenient unescapeBuffer fallback
// with U+FFFD replacement — lone-surrogate escapes included), raw
// non-ASCII and astral input, and the encodeCheck fast path (a segment
// only decodes when it carries a full valid %XX triple).
import { parse } from "node:querystring";

const cases: string[] = [
  "",
  "a",
  "a=",
  "=a",
  "=",
  "&",
  "&&",
  "a&&b",
  "a=1&",
  "&a=1",
  "a=1&&b=2",
  "a=1&a=2&a=3",
  "k=v&k=w&k=x&single=s",
  "a=b=c&==x",
  "a==b",
  "a%3Db=c",
  "key only",
  "sp ace=v al",
  "a+b=c+d&%20=+",
  "a=+%2B+",
  "a=%2B+b",
  "%zz",
  "%zz%25=%25zz",
  "%25%25=%25",
  "a=%E2%98%83&b=%FF&c=%zz&d=%1",
  "foo=%F0%9F%98%80&bar=%ED%A0%80",
  "%E2%98%83=%E2%98%83",
  "☃=☃&é=é",
  "😀=🌍",
  "%",
  "%2",
  "a=%",
  "a=%F",
  "a=%FG",
  "%GG=1",
  "1=a&0=b&x=c",
];
for (const c of cases) {
  console.log(JSON.stringify(c), JSON.stringify(parse(c)));
}

// The result dictionary reads like any index-signature record: repeated
// keys narrow to their array bucket, singles to the string arm, absent
// keys to undefined.
const r = parse("k=v&k=w&single=s");
const k = r["k"];
if (Array.isArray(k)) console.log("bucket", k.length, k.join("|"));
const s = r["single"];
if (typeof s === "string") console.log("single", s);
console.log("missing", r["missing"] === undefined);
console.log("keys", Object.keys(parse("1=a&0=b&x=c")).join(","));
