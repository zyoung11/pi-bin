// node:querystring.escape/unescape (Node is the oracle). escape encodes
// exactly the component unreserved set (ALPHA/DIGIT/- _ . ! ~ * ' ( )) as
// uppercase %XX — the full printable-ASCII sweep pins the set character
// by character, non-ASCII encodes its UTF-8 bytes. unescape is the
// strict-then-lenient pair: decodeURIComponent when the whole string
// decodes, else the legacy unescapeBuffer — valid %XX escapes decode to
// their byte, malformed escapes copy literally, every non-escape UTF-16
// code unit truncates to its LOW BYTE (Node's Buffer element write — the
// '☃%E9' and astral corners below), and the byte buffer decodes as UTF-8
// with U+FFFD replacement per maximal subpart.
import { escape as esc, unescape as unesc } from "node:querystring";

// The printable-ASCII sweep, one character at a time.
const parts: string[] = [];
for (let i = 32; i < 127; i++) parts.push(String.fromCharCode(i));
const ascii = parts.join("");
console.log("E1", esc(ascii));
console.log("E2", esc("héllo ☃ 😀"));
console.log("E3", esc(""));
console.log("E4", esc("a+b c=d&e"));

// Strict decodes.
console.log("U1", JSON.stringify(unesc("%41%20%42")));
console.log("U2", JSON.stringify(unesc("%E2%98%83")));
console.log("U3", JSON.stringify(unesc("%F0%9F%98%80")));
console.log("U4", JSON.stringify(unesc("abc")));
console.log("U5", JSON.stringify(unesc("%25")));
console.log("U6", JSON.stringify(unesc("a+b%20c")));

// Lenient fallbacks: malformed hex, invalid UTF-8 octets, lone-surrogate
// escapes, trailing '%', truncated sequences, code-unit truncation.
console.log("F1", JSON.stringify(unesc("a+b%20c%E2%98%83%zz%")));
console.log("F2", JSON.stringify(unesc("%ED%A0%80")));
console.log("F3", JSON.stringify(unesc("%FF%fe")));
console.log("F4", JSON.stringify(unesc("é%E9")));
console.log("F5", JSON.stringify(unesc("☃%E9")));
console.log("F6", JSON.stringify(unesc("😀%E9")));
console.log("F7", JSON.stringify(unesc("%")));
console.log("F8", JSON.stringify(unesc("%2")));
console.log("F9", JSON.stringify(unesc("100%")));
console.log("F10", JSON.stringify(unesc("%E2%98")));
console.log("F11", JSON.stringify(unesc("%GG%41")));
console.log("F12", JSON.stringify(unesc("%c3%a9%ff")));

// escape/unescape compose with parse/stringify's own paths — the same
// codec observed directly.
console.log("C1", esc(unesc("%E2%98%83")) === "%E2%98%83");
