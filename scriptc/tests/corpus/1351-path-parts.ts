// path.dirname / path.basename / path.extname — Node's posix edge cases
// (root-only paths, doubled leading slashes, dot-files, trailing dots,
// suffix stripping). Differential: Node is the oracle.
import { basename, dirname, extname } from "path";

const dirCases = [
  "",
  ".",
  "..",
  "/",
  "//",
  "///",
  "//a",
  "/a",
  "/a/b",
  "/a/b/",
  "/a/b/c",
  "a",
  "a/",
  "a/b",
  "a/b/",
  "a//b",
  "/a//b",
  "foo/bar/baz.txt",
  "/foo/bar/baz/",
];
for (const c of dirCases) {
  console.log("D", c, "=>", dirname(c));
}

const baseCases = [
  "",
  ".",
  "..",
  "/",
  "//",
  "a",
  "/a",
  "/a/b",
  "a/b/",
  "/a/b//",
  "basename.ext",
  "/basename.ext/",
  "/basename.ext//",
  "aaa/bbb",
  "aaa/bbb//",
];
for (const c of baseCases) {
  console.log("B", c, "=>", basename(c));
}

// The two-argument (suffix) form.
console.log("BS1", basename("bar.txt", ".txt"));
console.log("BS2", basename(".txt", ".txt"));
console.log("BS3", basename("foo.TXT", ".txt"));
console.log("BS4", basename("a/b/c.html", ".html"));
console.log("BS5", basename("a/b/c.html", "html"));
console.log("BS6", basename("a/b/c.html", "c.html"));
console.log("BS7", basename("aaa/bbb", "bb"));
console.log("BS8", basename("aaa/bbb", "bbb"));
console.log("BS9", basename("aaa/bbb", "aaa/bbb"));
console.log("BS10", basename("/aaa/bbb/", "bbb"));
console.log("BS11", basename("x", "longer-than-path"));
console.log("BS12", basename("file.txt", ""));

const extCases = [
  "",
  ".",
  "..",
  "...",
  "file",
  "file.txt",
  ".file",
  ".file.txt",
  "file.",
  "file..",
  "a/b.c/d",
  "a.b/c",
  "/a/b/file.ext",
  "a/b/.hidden",
  "a/b/..",
  "file.ext/",
  "file.ext//",
  ".../...",
  "..file",
  "a..b.c",
];
for (const c of extCases) {
  console.log("E", c, "=>", extname(c));
}
