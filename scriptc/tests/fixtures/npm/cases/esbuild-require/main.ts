// @dynamic
// esbuild-bundled npm dist (the published vercel CLI's chunk shape):
// external requires go through the bundle's __require helper, whose call
// sites the build-time edge walk cannot see — core-module requires must
// still reach the island's shims at runtime (Node resolves core modules
// unconditionally), and an unshimmed one that is never called must not
// break anything. tty.isatty answers through the real isatty(3) with
// Node's non-integer-fd false, not a constant.
import { probe } from "esbundled";

const out: string = probe();
console.log(out);
