/* Node driver for udp-driver-echo: sends datagrams to the fixture's
 * reported port, awaits each echo (UDP over loopback is reliable enough
 * for a request/reply lockstep), then sends "quit". Identical for both
 * lanes; its stdout is the third compared leg. */
import { createSocket } from "node:dgram";

const port = Number(process.argv[2]);
const sock = createSocket("udp4");

const messages = ["one", "two", "héllo"];
let idx = 0;

function sendNext() {
  if (idx === messages.length) {
    sock.send("quit", port, "127.0.0.1", () => {
      sock.close();
    });
    return;
  }
  sock.send(messages[idx], port, "127.0.0.1");
}

sock.on("message", (msg) => {
  console.log("driver got", msg.toString("utf8"));
  idx += 1;
  sendNext();
});
sendNext();
