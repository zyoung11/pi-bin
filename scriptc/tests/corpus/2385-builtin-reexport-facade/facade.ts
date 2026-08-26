// The universal/assert idiom: a user module whose exports ARE builtin
// members, re-exported by name.
export { ok, strictEqual } from "node:assert";
export { fileURLToPath } from "node:url";
