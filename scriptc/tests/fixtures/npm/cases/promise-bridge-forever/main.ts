// Awaiting a package promise that never settles: the bridge queues no
// engine jobs, so nothing keeps the loop alive — exhaustion abandons the
// parked fiber and the process exits 0, exactly Node's await-forever
// behavior. (Teardown then frees the abandoned frame's engine values so
// both worlds' audits stay clean — asserted by the sanitized lane.)
import { defer, deferNever } from "defer";

async function run(): Promise<void> {
  const v: number = await defer(1);
  console.log(v);
  await deferNever();
  console.log("unreached");
}
run();
console.log("main done");
