// path.resolve / path.relative. Both consult the process cwd for relative
// inputs — the harness runs Node and the native binary in the SAME cwd, so
// cwd-dependent results still compare byte-for-byte; absolute-input cases
// are cwd-free. Differential: Node is the oracle.
import { relative, resolve } from "node:path";

// Absolute-rooted resolutions (cwd-independent).
console.log("R1", resolve("/a", "b"));
console.log("R2", resolve("/a", "/b"));
console.log("R3", resolve("/a/b/..", "./c"));
console.log("R4", resolve("/", ""));
console.log("R5", resolve("/a/b", "../.."));
console.log("R6", resolve("/a/b", "../../.."));
console.log("R7", resolve("/var/lib", "../", "file/"));
console.log("R8", resolve("/some/dir", ".", "/absolute/"));
console.log("R9", resolve("/foo/bar", "./baz"));
console.log("R10", resolve("/foo/bar", "/tmp/file/"));

// cwd-involving forms: identical in both runs (same cwd), and derivable
// invariants hold.
const cwd = resolve();
console.log("CWD-eq", cwd === process.cwd());
console.log("CWD-a", resolve("a") === cwd + "/a");
console.log("CWD-empty", resolve("") === cwd);

// resolve of a whole array, spread.
const segs = ["/x", "y", "..", "z"];
console.log("RS", resolve(...segs));

console.log("L1", relative("/a/b", "/a/c"));
console.log("L2", relative("/a/b", "/a/b"));
console.log("L3", relative("/a/b/c", "/a"));
console.log("L4", relative("/", "/a/b"));
console.log("L5", relative("/a/b", "/"));
console.log("L6", relative("/a//b", "/a/b"));
console.log("L7", relative("/a/b", "/a/b/c/d"));
console.log("L8", relative("/a/b/c", "/a/b"));
console.log("L9", relative("/foo/bar/baz", "/foo/bar/qux/quux"));
console.log("L10", relative("/foo/bar", "/foo/bar/bazebra"));
console.log("L11", relative("/foo/barbaz", "/foo/bar"));
console.log("L12", relative("", ""));
console.log("L13", relative("a", "b") + "|");
console.log("L14", relative("a/b", "a/b/c/d"));
