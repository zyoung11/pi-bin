// @dynamic
// The island's zlib shim tier, differentially against Node — every line
// byte-exact (zlibzoo runs the surface inside the engine).
import { report } from "zlibzoo";

async function run(): Promise<void> {
  const out: string = await report();
  console.log(out);
}
run();
