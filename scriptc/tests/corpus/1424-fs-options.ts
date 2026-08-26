// The fs option forms: mkdirSync {recursive}, rmSync {recursive, force},
// mkdtempSync, accessSync + fs.constants — Node-differential (paths carry
// a random mkdtemp component, so error MESSAGES are asserted through
// includes/endsWith instead of printed raw).
import { accessSync, constants, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

console.log(constants.F_OK, constants.X_OK, constants.W_OK, constants.R_OK);

const dir = mkdtempSync(join(tmpdir(), "scr-corpus-"));
console.log(dir.startsWith(join(tmpdir(), "scr-corpus-")), dir.length > tmpdir().length + 12);
console.log(existsSync(dir));

// Recursive creation, the real-CLI output shape: nested dirs in one call.
mkdirSync(join(dir, "a/b/c"), { recursive: true });
console.log(existsSync(join(dir, "a/b/c")));
// An existing directory is a no-op with recursive.
mkdirSync(join(dir, "a/b"), { recursive: true });
// { recursive: false } is the plain mkdir — a missing parent throws.
try {
  mkdirSync(join(dir, "missing-parent/x"), { recursive: false });
} catch (e) {
  if (e instanceof Error) console.log("plain:", e.message.includes("ENOENT"), e.message.includes("mkdir"));
}
// A file in the way throws EEXIST at the file, ENOTDIR past it.
writeFileSync(join(dir, "file"), "x");
try {
  mkdirSync(join(dir, "file"), { recursive: true });
} catch (e) {
  if (e instanceof Error) console.log("target-file:", e.message.includes("EEXIST"), e.message.endsWith("file'"));
}
try {
  mkdirSync(join(dir, "file/sub"), { recursive: true });
} catch (e) {
  if (e instanceof Error) console.log("mid-file:", e.message.includes("ENOTDIR"), e.message.endsWith("sub'"));
}

// accessSync: present paths pass silently, missing ones throw.
accessSync(dir, constants.F_OK);
accessSync(dir, constants.R_OK | constants.W_OK | constants.X_OK);
accessSync(join(dir, "file"));
try {
  accessSync(join(dir, "nope"), constants.F_OK);
} catch (e) {
  if (e instanceof Error) console.log("access:", e.message.includes("ENOENT"), e.message.includes("access"));
}

// readFileSync still works inside the tree (the fd forms are 1425's).
writeFileSync(join(dir, "a/b/c/leaf.txt"), "deep");
console.log(readFileSync(join(dir, "a/b/c/leaf.txt"), "utf8"));

// rmSync: force swallows a missing path; without force it throws ENOENT.
rmSync(join(dir, "nope"), { recursive: true, force: true });
console.log("force-ok");
try {
  rmSync(join(dir, "nope"), { recursive: true });
} catch (e) {
  if (e instanceof Error) console.log("rm-missing:", e.message.includes("ENOENT"), e.message.includes("lstat"));
}
// A plain file removes through the options form too.
rmSync(join(dir, "file"), { recursive: true, force: true });
console.log("file-gone:", !existsSync(join(dir, "file")));
// The whole tree, files inside included.
rmSync(dir, { recursive: true, force: true });
console.log("tree-gone:", !existsSync(dir));
