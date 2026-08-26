// Default exports/imports of local modules: `export default <expr>` is the
// module's `default` binding — a module global like any named export.
// Init order must be Node's: colors, side, answer, then main's body.
import colors from "./colors.ts";
import { fromSide } from "./side.ts";
import answer from "./answer.ts";

console.log("main start");
console.log(colors.bold("B"), colors.red("R"), colors.plain("P"));
console.log(fromSide("side"));
console.log("answer", answer, answer + 1);

// The default's members behave like ordinary record fields.
const r = colors.red;
console.log(r("through a local"));
