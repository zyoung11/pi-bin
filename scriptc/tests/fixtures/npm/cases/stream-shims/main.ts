// @dynamic
// The island's node:stream family (stream, stream/promises,
// stream/consumers) and the upgraded events shim, differentially against
// Node: ordered event logs per scenario, byte-exact (streamzoo runs the
// surface inside the engine).
import { report } from "streamzoo";

async function run(): Promise<void> {
  const out: string = await report();
  console.log(out);
}
run();
