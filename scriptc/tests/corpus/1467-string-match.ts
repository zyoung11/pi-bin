// s.match(re) for non-g regexes: Node's exec-shaped result reduced to the
// honest slice — [whole match, ...captures] or null. Reads, narrowing,
// truthiness, and capture extraction all pinned against Node.
const text = "Signature Algorithm: sha256WithRSAEncryption";
const m = text.match(/Signature Algorithm:\s*(\S+)/i);
if (m) {
  console.log("whole:", m[0]);
  console.log("algo:", m[1]);
  console.log("len:", m.length);
} else {
  console.log("no match");
}

// No match: null (the falsy arm).
const none = "plain text".match(/:(\d+)$/);
console.log("none is null:", none === null);
if (!("host:8080".match(/:(\d+)$/))) console.log("SHOULD NOT PRINT");

// The port-extraction shape.
const hostPort = "example.com:8080";
const port = hostPort.match(/:(\d+)$/);
console.log("port:", port ? port[1] : "(none)");

// Anchors, quoting, and multiple captures.
const kv = 'key = "quoted value"'.match(/^(\w+) = "(.+)"$/);
if (kv) console.log("k:", kv[1], "v:", kv[2]);

// Truthiness guard (the !keyStr.match(...) shape).
const pem = "-----BEGIN RSA PRIVATE KEY-----";
if (!pem.match(/-----BEGIN [\w\s]*PRIVATE KEY-----/)) {
  console.log("SHOULD NOT PRINT (pem matches)");
} else {
  console.log("pem ok");
}

// Unicode subjects keep UTF-16 semantics.
const u = "café ☕ done".match(/(☕) (\w+)/u);
if (u) console.log("u:", u[1], u[2]);

// Case-insensitive flag.
console.log("i-flag:", "HELLO world".match(/hello/i) !== null);
