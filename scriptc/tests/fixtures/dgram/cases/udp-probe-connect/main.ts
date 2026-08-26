import { createSocket } from "node:dgram";

// The portless lan-ip probe shape (connect + address + close + unref),
// loopback-pinned; resolve-only executor variant (udp-probe-reject has
// the verbatim (resolve, reject) shape).
function probe(port: number, host: string): Promise<string> {
  return new Promise((resolve) => {
    const socket = createSocket({ type: "udp4", reuseAddr: true });
    socket.on("error", () => {
      socket.close();
      socket.unref();
      resolve("");
    });
    socket.connect(port, host, () => {
      const addr = socket.address();
      socket.close();
      socket.unref();
      if (addr && addr.address && addr.address !== "0.0.0.0") {
        resolve(addr.address);
      } else {
        resolve("");
      }
    });
  });
}

function main(): void {
  const target = createSocket({ type: "udp4", reuseAddr: true });
  target.bind(0, "127.0.0.1", () => {
    const port = target.address().port;
    const run = async () => {
      const ip = await probe(port, "127.0.0.1");
      if (ip === "") {
        console.log("probe failed");
      } else {
        console.log("probe ->", ip);
      }
      target.close();
    };
    run();
  });
}
main();
console.log("start");
