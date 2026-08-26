// A BRIDGED rejection nobody observes: the engine promise's rejection
// crosses into the static promise (the .then subscription marks the
// engine side handled — the island ledger stays silent), the async
// wrapper's own promise rejects unobserved, and the STATIC unhandled
// ledger reports at loop exit — one report, one voice, exit 1 like Node.
import { deferFail } from "defer";

async function run(): Promise<number> {
  return await deferFail("dropped");
}
run();
console.log("main done");
