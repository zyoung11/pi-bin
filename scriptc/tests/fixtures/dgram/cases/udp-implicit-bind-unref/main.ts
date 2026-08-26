import { createSocket } from "node:dgram";

// connect on a fresh socket: Node's implicit bind emits 'listening' then 'connect'.
const c = createSocket("udp4");
c.on("listening", () => console.log("c listening"));
c.on("connect", () => {
  console.log("c connect");
  c.close();
});

// unref waives loop liveness: u's 'listening' still fires (the loop runs
// for c), but u alone would not keep the process alive.
const u = createSocket({ type: "udp4" });
u.on("listening", () => console.log("u listening"));
u.bind(0, "127.0.0.1", () => {
  u.unref();
  c.connect(9, "127.0.0.1");
});
console.log("main");
