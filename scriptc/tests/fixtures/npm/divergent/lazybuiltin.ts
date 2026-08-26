// @dynamic
// The DIVERGENT half of lazy edge semantics: a require() of an unshimmed
// Node BUILTIN (esbundled's `__require("http2")`, the esbuild external-
// require shape; net/tls graduated to the socket tier's shims) — under
// Node the call loads core http2 and returns it; the island has no http2
// shim, so the call throws the island's own lazy error AT THE CALL, the
// only point Node would have loaded the module either. Build succeeds either way (the lazy edge embeds pointing at the
// refused node: key); this program is asserted directly, never
// differentially.
import { neverCalled } from "esbundled";

try {
  neverCalled();
  console.log("loaded");
} catch (e) {
  console.log((e as Error).message);
}
