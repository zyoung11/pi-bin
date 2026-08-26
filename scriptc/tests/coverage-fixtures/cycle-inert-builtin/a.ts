// One member of a benign import cycle whose top level calls a BUILTIN
// with a BUILTIN function value as the argument (vercel's link.ts spells
// `const readFile = promisify(fs.readFile)` at the top of a 5-cycle
// cluster; Object.freeze(JSON.parse) is the same shape on scriptc's own
// declared surface). No user code can run during the init window — the
// callee and the callable argument are both dts-rooted — so the cycle
// admission must hold and the module graph must load (the statement
// itself may still be a statement-level blocker; that is a different
// fence than SC1016).
import { helper } from "./b";

const frozenParse = Object.freeze(JSON.parse);

export const A = "a";

export function go(n: number): string {
  return helper(n) + ":" + typeof frozenParse;
}
