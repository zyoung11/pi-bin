// The URL class: construction, protocol/pathname/href/toString, "Invalid
// URL" TypeErrors, and URL | undefined unions. The parse table pins the
// WHATWG common ground the runtime implements (scheme/host lowercasing,
// default-port removal, dot segments with %2e equivalence, percent-encode
// sets, opaque paths); Node is the oracle.
const good = [
  "http://EXAMPLE.com/a/../b?q=1#f",
  "HTTPS://a.b:443/x",
  "http://a.b:8080/x",
  "http://h:00080/x",
  "http://h:0/x",
  "http://h:/x",
  "file:///tmp/x y/z",
  "file:/tmp/x",
  "file:tmp",
  "file://",
  "file://localhost/etc",
  "file:////double",
  "data:text/plain,hi there",
  "mailto:x@y.z",
  "git://Host/X",
  "git://host",
  "git://host?q",
  "http://user:pw@host/p",
  "ws://h:80/",
  "wss://h:443/a",
  "ftp://h:21/f",
  "http://h/a b?c d#e f",
  "http://h//double//slash/",
  "http://h/%2e%2e/x",
  "http://h/%2E/y",
  "http://h/..",
  "http://h/a/.",
  "http://h/./a",
  "https://h?q",
  "https://h#f",
  "http:foo.com/x",
  "http:/foo.com/x",
  "https:////h/x",
  "foo:/bar/../x",
  "foo:bar/../x",
  "view-source:http://x/",
  "c:\\windows",
  "http://h\\backslash\\x",
  "http://h/%41%zz",
  "http://h/a?b c?d",
  "http://h/{curly}?`tick`#lt<gt>",
  "  \thttp://trimmed.example/ \n ",
];
for (const c of good) {
  const u = new URL(c);
  console.log("U", u.href, "|", u.protocol, "|", u.pathname);
  console.log("T", u.toString() === u.href);
}

const bad = ["", "notaurl", "/abs/path", "./rel", "http://", "http://:80", "1http://x", "http//x", "http://h:8a/", "http://h:65536/", "http://u@/x"];
for (const c of bad) {
  try {
    new URL(c);
    console.log("PARSED", c);
  } catch (e) {
    if (e instanceof TypeError) {
      console.log("X", e.message);
    } else {
      console.log("not-a-typeerror");
    }
  }
}

// URL | undefined: the union arm everything downstream narrows through.
function parse(s: string): URL | undefined {
  try {
    return new URL(s);
  } catch {
    return undefined;
  }
}
const hit = parse("https://ok.example/path");
if (hit !== undefined) {
  console.log("hit", hit.protocol, hit.pathname);
}
const miss = parse("not a url");
console.log("miss", miss === undefined);
