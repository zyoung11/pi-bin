/* The driver-exercised UDP echo: a REAL remote sender (the Node driver)
 * sends datagrams at the reported port; the fixture echoes each back to
 * rinfo.port/rinfo.address, uppercasing nothing (byte fidelity), and
 * closes on "quit". Pins the PORT protocol for datagram fixtures and the
 * rinfo record against a cross-process peer. */
import { createSocket } from "node:dgram";

const server = createSocket({ type: "udp4", reuseAddr: true });
server.on("message", (msg, rinfo) => {
  const text = msg.toString("utf8");
  console.log("got", text, "bytes", rinfo.size);
  if (text === "quit") {
    server.close(() => console.log("closed"));
    return;
  }
  server.send(`echo:${text}`, rinfo.port, rinfo.address);
});
server.bind(0, "127.0.0.1", () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
