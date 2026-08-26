// The net-echo driver over real node:tls — strict ping-pong so both
// lanes log identically. The client trusts the fixture CA and verifies
// the server cert (SAN carries DNS:localhost and IP:127.0.0.1).
import { readFileSync } from "node:fs";
import { connect } from "node:tls";

const port = Number(process.argv[2]);
const ca = readFileSync(new URL("../../certs/ca.pem", import.meta.url));

const sock = connect({ port, host: "127.0.0.1", servername: "localhost", ca });
sock.setEncoding("utf8");

const script = ["hello", "wörld 😀", "quit"];
let received = "";
let step = 0;

sock.on("secureConnect", () => {
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
