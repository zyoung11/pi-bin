/* The 'upgrade' events, BOTH sides in one program — the WebSocket
 * handover proxy.ts is built on: the server's 'upgrade' fires INSTEAD of
 * 'request' for a Connection: upgrade request and hands the socket over
 * raw with the head bytes; the client's req.on('upgrade') fires INSTEAD
 * of 'response' on the 101, with the response head parsed
 * (statusCode/headers/rawHeaders/statusMessage — the exact fields the
 * proxy re-serializes) and its own raw socket + head. The program dials
 * ITSELF, so both halves run in one process and the ping-pong sequencing
 * pins a deterministic interleave (each print causally follows the
 * previous network step) — a driver-less differential case. */
import * as http from "node:http";

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  // Never reached: the driver conversation is upgrade-only.
  res.writeHead(200);
  res.end("plain");
});

server.on("upgrade", (req: http.IncomingMessage, socket, head: Buffer) => {
  console.log(`server upgrade ${req.method} ${req.url} upgrade=${req.headers.upgrade} head=${head.length}`);
  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\nUpgrade: scr\r\nConnection: Upgrade\r\n\r\nHELLO"
  );
  socket.on("data", (c: Buffer) => {
    console.log(`server got ${c.toString("utf8")}`);
    socket.end("BYE");
    server.close();
  });
  socket.on("error", () => socket.destroy());
});

server.listen(0, () => {
  const req = http.request({
    port: server.address().port,
    path: "/ws",
    method: "GET",
    headers: { connection: "Upgrade", upgrade: "scr" },
  });
  req.on("upgrade", (res: http.IncomingMessage, socket, head: Buffer) => {
    console.log(
      `client upgrade status=${res.statusCode} msg=${res.statusMessage} upgrade=${res.headers.upgrade} head=${head.toString("utf8")}`
    );
    console.log(`raw=${res.rawHeaders.join("|")}`);
    socket.write("PING");
    socket.on("data", (c: Buffer) => {
      console.log(`client got ${c.toString("utf8")} destroyed=${socket.destroyed}`);
    });
    socket.on("end", () => {
      console.log("client end");
      socket.end();
    });
    socket.on("error", () => socket.destroy());
  });
  req.end();
});
