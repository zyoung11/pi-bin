// @exit: 1
// An uncaught throw exits 1 — and the 'exit' listeners still run and see
// that code (Node runs them on the fatal-exception path; stderr carries
// the report and is not compared, stdout is).
process.on("exit", (code) => {
  console.log("exit saw", code);
});
console.log("before boom");
throw new Error("boom");
