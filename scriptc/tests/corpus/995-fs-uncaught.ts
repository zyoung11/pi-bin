// @exit: 1
// An uncaught fs error exits with code 1 exactly like Node, with all
// pre-throw stdout intact. (stderr differs — Node prints a stack trace,
// scriptc prints `Uncaught <message>` — and is not compared.)
import { readFileSync } from "node:fs";

console.log("phase one");
console.log("phase two");
const text = readFileSync("tmp-995-no-such-file-anywhere.txt", "utf8");
console.log("unreachable", text);
