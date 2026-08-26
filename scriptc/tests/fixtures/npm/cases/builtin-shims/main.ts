// @dynamic
// The island's os and diagnostics_channel shims, differentially against
// Node: os bridges platform/homedir/tmpdir to the SAME runtime functions
// the static lowerings call; diagnostics_channel is real pub/sub with
// Node's no-subscriber no-op and a tracingChannel that reports no
// subscribers (the AI SDK's telemetry probe path).
import { report } from "sysinfo";

const out: string = report();
console.log(out);
