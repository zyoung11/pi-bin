/* An unsupported IMPORT no longer stops analysis at preflight: the module
 * fence joins the blockers, the imported bindings poison at their use
 * sites (grouping with the import line), and every other statement still
 * counts — the report shows a percentage. Builds still fail on the import
 * exactly as before. (net, then dgram, graduated to supported modules, so
 * the out-of-scope "v8" carries this test now.) */
import { getHeapStatistics } from "v8";
import { join } from "node:path";

const cmd = join("/usr", "bin", "afplay");
console.log(cmd);
getHeapStatistics();
console.log("after");
