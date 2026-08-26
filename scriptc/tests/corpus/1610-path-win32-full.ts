// The full path.win32 namespace — resolve/normalize/dirname/basename/
// extname/isAbsolute/relative/toNamespacedPath beyond the join the corpus
// already pins (1533). The platform-specific namespace answers ITS
// platform's rules on any host (Node behaves identically on darwin/linux/
// win32 for these inputs, and the harness runs Node and the binary in the
// same cwd for the cwd-consulting members), so the oracle is exact
// everywhere: drive-letter roots, UNC paths, \\?\ and \\.\ device paths,
// both separators, and the reserved-device-name hardening.
import * as path from "node:path";
import * as w from "node:path/win32";
import * as posix from "node:path/posix";

// resolve: drive roots win, later drives replace earlier ones, UNC roots.
console.log("R1", w.resolve("C:\\a", "b"));
console.log("R2", w.resolve("C:\\a", "D:\\x", "y"));
console.log("R3", w.resolve("c:\\blah\\blah", "d:/games", "c:../a"));
console.log("R4", w.resolve("\\\\server\\share", "..", "relative\\"));
console.log("R5", w.resolve("C:\\foo\\tmp.3\\", "..\\tmp.3\\cycles\\root.js"));
console.log("R6", w.resolve("C:\\", "\\\\?\\C:\\q"));
console.log("R7", w.resolve("/a", "b"));

// normalize: UNC roots, device paths, dots, mixed separators, reserved
// names (the CVE-era ".\\" prefixing).
console.log("N1", w.normalize("C:\\a\\..\\b\\.\\c\\\\"));
console.log("N2", w.normalize("//server/share//dir/file.txt"));
console.log("N3", w.normalize("\\\\.\\PHYSICALDRIVE0\\x\\..\\y"));
console.log("N4", w.normalize("\\\\?\\UNC\\srv\\sh\\a\\..\\b"));
console.log("N5", w.normalize("C:"));
console.log("N6", w.normalize("c:..\\a"));
console.log("N7", w.normalize("NUL"));
console.log("N8", w.normalize("CON:extra"));
console.log("N9", w.normalize("a:./b"));
console.log("N10", w.normalize("foo/bar\\baz"));

// dirname / basename / extname over drive and UNC shapes.
console.log("D1", w.dirname("C:\\a\\b"));
console.log("D2", w.dirname("C:\\a"));
console.log("D3", w.dirname("C:\\"));
console.log("D4", w.dirname("\\\\server\\share\\dir\\file"));
console.log("D5", w.dirname("\\\\server\\share"));
console.log("B1", w.basename("C:\\a\\b.txt"));
console.log("B2", w.basename("C:\\a\\b.txt", ".txt"));
console.log("B3", w.basename("C:foo"));
console.log("B4", w.basename("\\\\server\\share\\f.ext"));
console.log("E1", w.extname("C:\\a\\b.tar.gz"));
console.log("E2", w.extname("C:.txt"));
console.log("E3", w.extname("\\\\server\\share\\file."));

// isAbsolute: both separators, drive roots, drive-relative forms.
console.log("A1", w.isAbsolute("C:\\x"), w.isAbsolute("C:/x"), w.isAbsolute("C:x"));
console.log("A2", w.isAbsolute("\\x"), w.isAbsolute("/x"), w.isAbsolute("x"));
console.log("A3", w.isAbsolute("\\\\server\\share"), w.isAbsolute(""));

// relative: case-insensitive drive comparison, UNC pairs, device roots.
console.log("L1", w.relative("C:\\foo\\bar", "C:\\foo\\bar\\baz"));
console.log("L2", w.relative("C:\\foo\\bar\\baz", "C:\\foo"));
console.log("L3", w.relative("c:\\aaaa\\bbbb", "C:\\AAAA"));
console.log("L4", w.relative("C:\\", "C:\\foo"));
console.log("L5", w.relative("c:\\blah\\blah", "d:\\games"));
console.log("L6", w.relative("\\\\server\\share\\a", "\\\\server\\share\\b"));

// toNamespacedPath: \\?\ prefixing for drive and UNC absolutes, identity
// for the already-namespaced and the too-short.
console.log("T1", w.toNamespacedPath("C:\\foo\\bar"));
console.log("T2", w.toNamespacedPath("\\\\server\\share\\x"));
console.log("T3", w.toNamespacedPath("\\\\?\\C:\\x"));
console.log("T4", w.toNamespacedPath(""));
console.log("T5", posix.toNamespacedPath("/tmp/x"));
// The bare module's answers its own platform (posix identity on the
// default lanes, the \\?\ prefixer on the Windows lane) — node and the
// binary agree either way.
console.log("T6", path.toNamespacedPath("") === "");

// The namespaces' constants, cross-checked against the bare module's.
console.log("C1", w.sep, w.delimiter, posix.sep, posix.delimiter);
console.log("C2", (path.sep === w.sep) === (path.delimiter === w.delimiter));
