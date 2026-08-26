// @dynamic
// The island's assert shim tier, differentially against Node — every line
// byte-exact (assertzoo runs the surface inside the engine).
import { report } from "assertzoo";

async function run(): Promise<void> {
  const out: string = await report();
  console.log(out);
}
run();
