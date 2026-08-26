// The stdin slice, read half: the readFileSync(fd) forms over the empty
// closed pipe the harness provides — process.stdin deliberately untouched
// (see 1425's note on Node's non-blocking footgun).
import { readFileSync } from "node:fs";

const text = readFileSync(0, "utf8");
console.log(JSON.stringify(text), text.length);
const bytes = readFileSync(0);
console.log(bytes.length, bytes.byteLength);
console.log("done");
