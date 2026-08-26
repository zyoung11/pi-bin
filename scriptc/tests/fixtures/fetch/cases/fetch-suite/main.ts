// @dynamic
// Embedded npm code issuing REAL requests against the harness's local
// HTTP server (argv[2]); argv[3] points at a port with no listener (the
// rejection path). Byte-exact vs Node.
import { run } from "webfetch";

run(process.argv[2], process.argv[3]);
