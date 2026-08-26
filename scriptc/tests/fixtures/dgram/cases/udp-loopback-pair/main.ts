/* Two UDP sockets over loopback: bind(0)/'listening', send with explicit
 * port+address, 'message' with the rinfo record (size read; the
 * ephemeral ports stay out of compared output), a reply through
 * rinfo.port/rinfo.address, and close-callback ordering (close() call
 * order, not creation order). */
import { createSocket } from "node:dgram";

const server = createSocket({ type: "udp4", reuseAddr: true });
server.on("listening", () => {
  console.log("server listening");
});
server.on("message", (msg, rinfo) => {
  console.log("server got", msg.toString("utf8"), "size", rinfo.size, "family", rinfo.family);
  console.log("rinfo address", rinfo.address, "port ok", rinfo.port > 0);
  server.send(`pong:${msg.toString("utf8")}`, rinfo.port, rinfo.address);
});
const client = createSocket("udp4");
client.on("message", (msg) => {
  console.log("client got", msg.toString("utf8"));
  client.close(() => console.log("client closed"));
  server.close(() => console.log("server closed"));
});
server.bind(0, "127.0.0.1", () => {
  const addr = server.address();
  console.log("bound", addr.family, addr.address, addr.port > 0);
  client.send("hi", addr.port, "127.0.0.1");
});
console.log("main done");
