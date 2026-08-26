// The composed hash chain — createHash("sha256").update(data).digest("hex")
// fused into one call (the Hash handle never materializes). Both import
// spellings, string and Buffer inputs, empty input, multi-block (>64-byte
// and >128-byte) messages, and the portless idioms: the 6-char label hash
// (auto.ts) and the CA-cert fingerprint over readFileSync bytes (certs.ts).
import { createHash } from "node:crypto";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

console.log(createHash("sha256").update("").digest("hex"));
console.log(createHash("sha256").update("abc").digest("hex"));
console.log(crypto.createHash("sha256").update("hello world").digest("hex"));

// Exactly one and two compression blocks with the length padding.
console.log(createHash("sha256").update("a".repeat(55)).digest("hex"));
console.log(createHash("sha256").update("a".repeat(56)).digest("hex"));
console.log(createHash("sha256").update("a".repeat(64)).digest("hex"));
console.log(createHash("sha256").update("a".repeat(119)).digest("hex"));
console.log(createHash("sha256").update("a".repeat(200)).digest("hex"));

// Non-ASCII input hashes its UTF-8 bytes (Node's default input encoding).
console.log(createHash("sha256").update("héllo wörld — ünïcode ✓").digest("hex"));

// The auto.ts idiom: a 6-char label hash.
const label = "myapp-some-very-long-label-that-needs-truncation";
console.log(createHash("sha256").update(label).digest("hex").slice(0, 6));

// Buffer input — the certs.ts fingerprint idiom over file bytes.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scr-hash-"));
const pemPath = path.join(tmp, "ca.pem");
fs.writeFileSync(pemPath, "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----\n");
const pem = fs.readFileSync(pemPath);
console.log(crypto.createHash("sha256").update(pem).digest("hex"));
fs.rmSync(pemPath);
fs.rmdirSync(tmp);

// Buffer.from bytes, including NULs and high bytes.
console.log(createHash("sha256").update(Buffer.from([0, 1, 2, 255, 128, 0])).digest("hex"));
console.log(createHash("sha256").update(Buffer.from("abc", "utf8")).digest("hex"));

// sha1 + base64 — the RFC 6455 Sec-WebSocket-Accept idiom (proxy.ts).
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const wsKey = "dGhlIHNhbXBsZSBub25jZQ==";
console.log(crypto.createHash("sha1").update(wsKey + WS_GUID).digest("base64"));
console.log(createHash("sha1").update("").digest("hex"));
console.log(createHash("sha1").update("abc").digest("base64"));
console.log(createHash("sha256").update("abc").digest("base64"));
console.log(createHash("sha1").update("x".repeat(200)).digest("hex"));

