// @exit: 3
// process.exit() runs the 'exit' listeners too (Node's contract), with
// the REAL code, before the teardown-free exit — and nothing after the
// exit call runs. The cursor-restore pattern this exists for
// (audio-preview's process.once("exit", restore)) is exactly this shape.
process.once("exit", (code) => {
  console.log("restore at", code);
});
console.log("before exit");
process.exit(3);
