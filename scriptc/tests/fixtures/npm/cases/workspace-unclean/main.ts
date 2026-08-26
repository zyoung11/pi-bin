// A workspace-linked UNTYPED package (main → shipped CJS, no .d.ts, the
// @vercel/go shape): its realpath escapes node_modules, so allowJs pulls
// the shipped JS into the checker's program — and the checker refuses
// shapes Node runs fine. Those errors are the foreign-tsconfig story
// (third-party shipped JS the program's author cannot fix); the package's
// execution home is the island, so they never gate, and this program
// must build AND agree with Node.
import { describe } from "wsunclean";

console.log(describe(21));
