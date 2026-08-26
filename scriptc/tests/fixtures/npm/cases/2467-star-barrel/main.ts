// The tsc barrel (__exportStar(require("./a.js"), exports) after the
// defineProperty __esModule stamp, with an own exports.fn beside the
// stars and the void-init preamble): the canonical table re-exports the
// star targets and the own member export by value.
import { alpha, BETA, combined } from "gtbarrel";

console.log(alpha(), BETA, combined());
