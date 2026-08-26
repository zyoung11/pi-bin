// @dynamic
// The island's node:crypto shim, differentially against Node: md5/sha1/
// sha256 digests and HMACs byte-exact through the C bridge, pbkdf2, the
// exact error shapes, and shape-only checks over the randomness surface
// (cryptozoo runs the surface inside the engine).
import { report } from "cryptozoo";

async function run(): Promise<void> {
  const out: string = await report();
  console.log(out);
}
run();
