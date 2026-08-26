// @exit: 1
// A spawn failure with NO "error" listener is an unhandled 'error' event:
// Node throws it (exit 1), and so does scriptc — the exit listener never
// fires (spawn failure emits "error", never "exit"). stdout up to the
// failure is flushed; stderr (the error rendering) is not compared.
import { spawn } from "node:child_process";

const c = spawn("/no/such/binary", [], { stdio: "ignore" });
c.on("exit", (code) => {
  console.log("never", code ?? -1);
});
console.log("before");
