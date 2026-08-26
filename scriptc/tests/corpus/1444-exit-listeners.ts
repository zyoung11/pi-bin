// The process 'exit' event on the normal-termination path: listeners run
// SYNCHRONOUSLY at exit in registration order with the exit code, `once`
// registers like `on` (exit fires once ever), and `off` removes by
// identity — the registered-then-removed listener stays silent. A timer
// proves the loop ran to exhaustion first: 'exit' fires after everything
// the program scheduled.
const removed = () => {
  console.log("removed listener ran");
};
process.once("exit", removed);
process.off("exit", removed);

process.on("exit", (code) => {
  console.log("exit A", code);
});
process.once("exit", () => {
  console.log("exit B");
});

setTimeout(() => {
  console.log("timer ran");
}, 30);
console.log("main done");
