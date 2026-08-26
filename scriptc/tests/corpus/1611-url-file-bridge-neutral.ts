// The file-URL bridge, platform-neutrally: 1356 pins the posix arm with
// literal file:///tmp URLs (which throw on Windows — Node too), so this
// program builds every URL FROM the running platform's own paths and
// asserts round-trips and contracts that hold on posix and win32 alike.
// Node and the binary run in the same cwd on every lane, so the
// cwd-derived values compare byte-for-byte.
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

const cwd = process.cwd();
const cwdUrl = pathToFileURL(cwd);
console.log("U1", cwdUrl.protocol, cwdUrl.href.indexOf("file://") === 0);
console.log("U2", fileURLToPath(cwdUrl) === cwd);
console.log("U3", fileURLToPath(cwdUrl.href) === cwd);

// Awkward names round-trip: spaces, percent signs, unicode.
const awkward = join(cwd, "a b", "100% légit 🌍");
console.log("U4", fileURLToPath(pathToFileURL(awkward)) === awkward);
console.log("U5", pathToFileURL(join(cwd, "sp ace")).href.endsWith("sp%20ace"));

// Relative paths resolve against the cwd (same cwd in both runs).
console.log("U6", fileURLToPath(pathToFileURL("rel/x")) === join(cwd, "rel", "x"));

// The pathname keeps its encodings; the platform arm decodes them.
const spaced = pathToFileURL(join(cwd, "d ir"));
console.log("U7", spaced.pathname.endsWith("d%20ir"), spaced.hostname === "");

function fails(input: string): string {
  try {
    fileURLToPath(input);
    return "no-throw";
  } catch (e) {
    if (e instanceof TypeError) {
      return e.message;
    }
    return "not-a-typeerror";
  }
}
// Same TypeError on every platform.
console.log("F1", fails("http://x/y"));
console.log("F2", fails("not a url"));
// Platform-specific MESSAGES (encoded-separator wording, host handling)
// — but Node and the binary agree per platform, which is the assertion.
console.log("F3", fails("file:///a%2Fb"));
console.log("F4", fails("file://host/name"));
