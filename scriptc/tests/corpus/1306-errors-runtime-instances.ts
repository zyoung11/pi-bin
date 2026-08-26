// The runtime's own failures are REAL error objects: typed catches narrow
// them by class, e.name is Node-exact, and where the message is Node's
// text too (replaceAll, fs) it prints differentially byte-for-byte. JSON
// message TEXT stays approximate (SEMANTICS.md), so only names print here.
import { readFileSync } from "node:fs";

// JSON.parse syntax errors: SyntaxError instances.
function parseName(raw: string): string {
  try {
    JSON.parse(raw);
    return "ok";
  } catch (e) {
    if (e instanceof SyntaxError) return e.name;
    if (e instanceof Error) return `unexpected ${e.name}`;
    return "not an error";
  }
}
console.log(parseName("42"));
console.log(parseName("{bad"));
console.log(parseName(""));
console.log(parseName("[1,2,"));
console.log(parseName('"open'));

// A SyntaxError is still an Error, and never a TypeError.
try {
  JSON.parse("{nope");
} catch (e) {
  if (e instanceof Error) console.log("is error", e instanceof TypeError);
}

// replaceAll on a non-global regex: Node's exact TypeError, message included.
try {
  console.log("aaa".replaceAll(/a/, "b"));
} catch (e) {
  if (e instanceof TypeError) console.log(`${e.name}: ${e.message}`);
}
console.log("aaa".replaceAll(/a/g, "b"));

// fs failures: Error instances carrying Node's message text.
try {
  readFileSync("/nonexistent-scriptc-fixture.txt", "utf8");
} catch (e) {
  if (e instanceof Error) {
    console.log("fs", e.name, "|", e.message);
    console.log("fs typed?", e instanceof TypeError, e instanceof SyntaxError);
  }
}
