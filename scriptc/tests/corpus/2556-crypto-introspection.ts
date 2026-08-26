// The crypto introspection statics, baked at their sites: getFips()
// answers 0 (a compiled binary is never a FIPS build — Node's own answer
// for one), the three name lists answer Node v24's tables as fresh
// string[] values, and crypto.constants members read as literals (the
// http2.constants stance). Every print is identical under Node and the
// native runtime because the tables ARE Node v24's answers.
import { constants, getCiphers, getCurves, getFips, getHashes } from "node:crypto";
import * as crypto from "node:crypto";

// getFips: both import spellings, truthiness and the exact value.
console.log("fips", getFips(), crypto.getFips());
if (!getFips()) {
  console.log("not a fips build");
}

// The name lists: real arrays (fresh per call), probed by membership —
// the suite's own usage shape (skip-if-absent guards).
const ciphers = getCiphers();
console.log("ciphers-nonempty", ciphers.length > 0);
console.log("aes", ciphers.includes("aes-128-cbc"), ciphers.includes("aes-256-gcm"));
console.log("des3-wrap", ciphers.includes("des3-wrap"));
console.log("no-such-cipher", ciphers.includes("rot13"));
console.log("fresh", getCiphers() !== ciphers);

const hashes = crypto.getHashes();
console.log("hashes-nonempty", hashes.length > 0);
console.log("sha", hashes.includes("sha256"), hashes.includes("sha1"), hashes.includes("sha512"));

const curves = getCurves();
console.log("curves-nonempty", curves.length > 0);
console.log("curves", curves.includes("secp256k1"), curves.includes("prime256v1"));
console.log("no-such-curve", curves.includes("curve25519"));

// crypto.constants: the chained namespace read, numbers and the string
// member, expressions over them.
console.log("padding", constants.RSA_PKCS1_PADDING, crypto.constants.RSA_PKCS1_OAEP_PADDING);
console.log("no-ticket", crypto.constants.SSL_OP_NO_TICKET);
console.log("salt", constants.RSA_PSS_SALTLEN_DIGEST, constants.RSA_PSS_SALTLEN_MAX_SIGN);
console.log("cipher-list-head", constants.defaultCoreCipherList.split(":")[0]);

// The destructure shape (plain names and a rename).
const { SSL_OP_ALL, RSA_NO_PADDING: noPad } = crypto.constants;
console.log("destructured", SSL_OP_ALL > 0, noPad);
const flags = crypto.constants.SSL_OP_NO_TICKET | crypto.constants.SSL_OP_NO_COMPRESSION;
console.log("combined", flags);
