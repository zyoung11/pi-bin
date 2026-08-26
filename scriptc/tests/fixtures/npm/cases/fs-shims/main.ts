// @dynamic
// The island's node:fs and node:fs/promises shims, differentially
// against Node on the real filesystem: a fresh mkdtemp sandbox, three
// call spellings, Node's exact error shapes with errno-name codes, and
// the memory-backed streams — every line byte-exact (fszoo runs the
// surface inside the engine).
import { report } from "fszoo";

async function run(): Promise<void> {
  const out: string = await report();
  console.log(out);
}
run();
