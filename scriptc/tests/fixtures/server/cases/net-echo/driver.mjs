// The shared client driver (both lanes run THIS under node): strict
// ping-pong — every send waits for its echo, so the server sees one
// chunk per message and both lanes log identically.
import { connect } from "node:net";

const port = Number(process.argv[2]);
const sock = connect(port, "127.0.0.1");
sock.setEncoding("utf8");

const script = ["hello", "wörld 😀", "quit"];
let received = "";
let step = 0;

sock.on("connect", () => {
  console.log("driver connected");
  sock.write(script[step]);
});

sock.on("data", (text) => {
  received += text;
  const want = step < script.length - 1 ? `echo:${script[step]}` : "bye";
  if (received === want) {
    console.log(`driver got ${received}`);
    received = "";
    step += 1;
    if (step < script.length) sock.write(script[step]);
  }
});

sock.on("end", () => console.log("driver end"));
sock.on("close", () => console.log("driver close"));
