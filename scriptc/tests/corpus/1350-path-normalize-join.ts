// path.normalize / path.join / path.isAbsolute — a dense table of the edge
// cases Node's own posix suite pins (trailing slashes, "..", empty and "."
// segments, doubled separators). Node runs this same file, so every line
// is a differential assertion against the real implementation.
import { isAbsolute, join, normalize, sep, delimiter } from "node:path";

const normCases = [
  "",
  ".",
  "..",
  "/",
  "//",
  "///",
  "./",
  "../",
  "/..",
  "/../",
  "/../..",
  "a",
  "a/",
  "a/b/c",
  "a/b/c/",
  "/a/b/c",
  "/a/b/c/",
  "a//b//c",
  "a/./b",
  "a/../b",
  "a/b/..",
  "a/b/../",
  "../a/b",
  "../../a",
  "a/b/../../..",
  "./a/./b/./",
  "/../../a",
  "a/b/c/../../../..",
  ".//b",
  "a/..",
  "./..",
  "../.",
  "...",
  ".../..",
  "a/.../b",
  "fixtures///b/../b/c.js",
  "/foo/../../../bar",
  "a//b//../b",
  "a//b//./c",
  "a//b//.",
  "/a/b/c/../../../x/y/z",
  "///..//./foo/.//bar",
  "bar/foo../../",
  "bar/foo../..",
  "bar/foo../../baz",
  "bar/foo../",
  "bar/foo..",
  "../foo../../../bar",
  "../.../.././.../../../bar",
  "../../../foo/../../../bar",
  "../../../foo/../../../bar/../../",
  "../foobar/barfoo/foo/../../../bar/../../",
  "../.../../foobar/../../../bar/../../baz",
  "foo/bar\\baz",
];
for (const c of normCases) {
  console.log("N", c, "=>", normalize(c));
}

console.log("J0", join());
console.log("J1", join(""));
console.log("J2", join("", ""));
console.log("J3", join("a", "b"));
console.log("J4", join("a/", "/b"));
console.log("J5", join("a", "..", "b"));
console.log("J6", join("/", "a"));
console.log("J7", join("a", "", "b"));
console.log("J8", join(".", "x"));
console.log("J9", join("..", ".."));
console.log("J10", join("/a", "/b"));
console.log("J11", join("/foo", "bar", "baz/asdf", "quux", ".."));
console.log("J12", join("a", ".", "b"));
console.log("J13", join("/", "//a", "b/"));
console.log("J14", join(" ", "b"));

// A whole-array spread forwards the pack directly.
const parts = ["x", "..", "y", "z/"];
console.log("JS", join(...parts));

const absCases = ["", "/", "a", "/a", "//", "./a", "../a", " /a"];
for (const c of absCases) {
  console.log("A", c, "=>", isAbsolute(c));
}

console.log("sep", sep, "delim", delimiter);
