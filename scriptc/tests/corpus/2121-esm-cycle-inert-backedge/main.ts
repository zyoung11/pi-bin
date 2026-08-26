// A genuine two-module import cycle whose CLOSING edge binds only a
// namespace object used as bare statements — nothing can observe the
// partially-initialized module through it (namespace bindings initialize
// at link, never TDZ, and no member is ever read), so Node evaluates the
// cycle benignly: peer's revisit of this module is a cache hit, peer
// completes first, then this module — the guarded %init calls reproduce
// that order exactly.
import { peerTag } from "./peer.ts";
export const mainTag = "main";
console.log("main sees", peerTag);
