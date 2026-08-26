import { createSocket } from "node:dgram";

// An 'error' with no listener is fatal: Node throws the error (exit 1).
const a = createSocket({ type: "udp4" });
const b = createSocket({ type: "udp4" });
a.bind(0, "127.0.0.1", () => {
  console.log("a bound");
  b.bind(a.address().port, "127.0.0.1");
});
console.log("main");
