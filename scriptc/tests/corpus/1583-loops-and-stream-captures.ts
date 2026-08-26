// `for (;;)` whose every exit is a return: the walk-up-until-root idiom —
// a non-void function tsc accepts without a trailing return (the
// procStream-capture half of this tail lives in the node-types fixture,
// where NodeJS.WritableStream exists to type the captured stream).
import * as fs from "node:fs";
import * as path from "node:path";

function findExistingAncestor(targetPath: string): string | null {
  let current = targetPath;
  for (;;) {
    if (fs.existsSync(current)) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}
const missing = findExistingAncestor("/definitely/not/a/real/dir/anywhere");
console.log(missing === null ? "null" : missing);
console.log(findExistingAncestor(process.cwd()) === process.cwd());

// The try/catch walk (findWorkspaceRoot's shape).
function walkUp(start: string): string | null {
  let dir = start;
  for (;;) {
    try {
      fs.accessSync(path.join(dir, "definitely-not-here.yaml"), fs.constants.R_OK);
      return dir;
    } catch {
      // not here
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
const rootWalk = walkUp(process.cwd());
console.log(rootWalk === null ? "null" : rootWalk);
