// @exit: 1
// An uncaught throw ends the process with exit code 1 (Node's uncaught
// exit code); everything printed BEFORE the throw must still match Node
// byte-for-byte. (stderr — where the uncaught value is reported — is not
// compared: the formats differ, see SEMANTICS.md.)
function tally(parts: string[]): number {
  let total = 0;
  for (const p of parts) {
    total = total + p.length;
    if (p === "stop") {
      throw "tally aborted at " + total;
    }
  }
  return total;
}

console.log("phase one");
try {
  console.log("guarded:", tally(["ab", "cde"]));
} catch {
  console.log("not reached");
}
console.log("phase two");
const held = ["still", "alive", "when", "it", "throws"];
console.log("held", held.length, "strings");
tally(["go", "go", "stop", "never"]);
console.log("unreachable");
