// @dynamic
// Embedded npm code driving the island's node:http CLIENT against the
// harness's local server (argv[2]); argv[3] is the refused port. The
// island's http rides scr_net + scr_http's client parser — byte-exact
// vs Node's core http.
import { run } from "islandhttp";

run(process.argv[2], process.argv[3]);
