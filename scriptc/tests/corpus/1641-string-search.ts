// String.prototype.search over regex arguments: the first match's UTF-16
// index or -1, lastIndex-independent (a fresh exec from 0 — /g is
// irrelevant, /y anchors at position 0). Pins the harness's directive
// probes (// Flags:, // Env:) plus flags, captures, alternation, unicode,
// and the empty-pattern zero.
const source = "// Copyright\n'use strict';\n// Flags:  --expose-internals\n// Env: FOO=bar\nrest";
console.log(source.search(/\/\/ Flags:\s+--/));
console.log(source.search(/\/\/ Env:\s+/));
console.log(source.search(/\/\/ Missing:\s+/));

console.log("abcabc".search(/b/));
console.log("abcabc".search(/b/g)); // g never changes search
console.log("abcabc".search(/b/y)); // y anchors at 0 -> -1
console.log("bcabc".search(/b/y)); // anchored hit at 0
console.log("aXbc".search(/x/i));
console.log("aXbc".search(/x/));
console.log("".search(/x*/)); // empty match at 0
console.log("abc".search(/$/)); // end anchor
console.log("한글ab".search(/a/u)); // index counts UTF-16 units
console.log("h\u{1F600}x".search(/x/u)); // astral pair counts as 2
console.log("aaab".search(/a+(b)?/));
console.log("cat dog".search(/dog|cat/));
console.log("line1\nline2".search(/^line2$/m));

// A regex value that flows through a variable takes the same path.
const re = /\d+/;
const hay = "abc123def";
console.log(hay.search(re));
console.log("no digits here".search(re));
