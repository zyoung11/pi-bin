/* The portless createLoopbackConnection + isPortListening pair,
 * verbatim: net.connect with an options object carrying a caller
 * `lookup` (a fixed both-families answer) and autoSelectFamily — the
 * dial tries 127.0.0.1 first and falls back to ::1 when it refuses. The
 * ::1-only listener leg exercises exactly that fallback (a Vite-style
 * IPv6-only dev server); the free-port leg exhausts the whole list. */
import * as net from "node:net";

function loopbackLookup(
  _hostname: string,
  _options: unknown,
  callback: (
    err: NodeJS.ErrnoException | null,
    addresses: { address: string; family: number }[]
  ) => void
): void {
  callback(null, [
    { address: "127.0.0.1", family: 4 },
    { address: "::1", family: 6 },
  ]);
}

function createLoopbackConnection(port: number): net.Socket {
  return net.connect({
    host: "localhost",
    port,
    autoSelectFamily: true,
    lookup: loopbackLookup as net.LookupFunction,
  });
}

function isPortListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createLoopbackConnection(port);
    let settled = false;

    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(3000);
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false));
  });
}

const dual = net.createServer((socket) => socket.end());
const v6only = net.createServer((socket) => socket.end());

async function main(dualPort: number, v6Port: number, freePort: number): Promise<void> {
  console.log("dual-stack listener:", await isPortListening(dualPort));
  console.log("v6-only listener (the fallback leg):", await isPortListening(v6Port));
  console.log("free port:", await isPortListening(freePort));
  dual.close();
  v6only.close(() => console.log("done"));
}

dual.listen(0, () => {
  const dualPort = dual.address().port;
  v6only.listen({ port: 0, host: "::1", ipv6Only: true }, () => {
    const v6Port = v6only.address().port;
    const probe = net.createServer();
    probe.listen(0, () => {
      const freePort = probe.address().port;
      probe.close(() => {
        main(dualPort, v6Port, freePort);
      });
    });
  });
});
