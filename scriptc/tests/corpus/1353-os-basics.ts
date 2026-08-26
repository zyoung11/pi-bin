// node:os — platform/homedir/tmpdir/EOL. Values are machine-dependent but
// DETERMINISTIC within one run: the harness gives Node and the native
// binary the same environment, so raw values compare equal too.
import { EOL, homedir, platform, tmpdir } from "node:os";
import { isAbsolute } from "node:path";

console.log(platform() === process.platform, platform().length > 0);
console.log(isAbsolute(homedir()), homedir().length > 0);
console.log(isAbsolute(tmpdir()), tmpdir().length > 0);
// Node trims ONE trailing slash from $TMPDIR (unless the result would be
// empty) — same env in both runs, so the trimmed value matches exactly.
console.log(tmpdir());
console.log(EOL === "\n", EOL.length);
