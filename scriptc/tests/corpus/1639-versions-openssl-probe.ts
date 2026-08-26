// Node's own "is crypto available" idiom: Boolean(process.versions.openssl).
// The binary answers with the compat target's string (the versions.node
// stance) so capability probes RUN crypto code instead of self-skipping;
// the exact string names the compat target (SEMANTICS.md), so only its
// presence and type are asserted differentially.
const v = process.versions.openssl;
console.log(typeof v, v !== undefined && v.length > 0);
const gated = v ? "crypto-path" : "skip-path";
console.log(gated);
