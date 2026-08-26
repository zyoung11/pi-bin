/* The portless probeDefaultRouteIPv4 shape VERBATIM (lan-ip.ts): a
 * (resolve, reject) executor whose reject escapes into the socket's
 * 'error' and connect callbacks, `"address" in addr` guarding the
 * AddressInfo read, and reject(new Error(...)) on the no-route arm —
 * loopback-pinned so both lanes converse locally. */
import { createSocket } from "node:dgram";

function probeRoute(port: number, host: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = createSocket({ type: "udp4", reuseAddr: true });
    socket.on("error", (error) => {
      socket.close();
      socket.unref();
      reject(error);
    });
    socket.connect(port, host, () => {
      const addr = socket.address();
      socket.close();
      socket.unref();
      if (addr && "address" in addr && addr.address && addr.address !== "0.0.0.0") {
        resolve(addr.address);
      } else {
        reject(new Error("No route to host"));
      }
    });
  });
}

async function run(target: ReturnType<typeof createSocket>, port: number): Promise<void> {
  try {
    const ip = await probeRoute(port, "127.0.0.1");
    console.log("probe resolved:", ip);
  } catch (e) {
    if (e instanceof Error) console.log("probe rejected:", e.message);
  }
  target.close();
}

function main(): void {
  const target = createSocket({ type: "udp4", reuseAddr: true });
  target.bind(0, "127.0.0.1", () => {
    run(target, target.address().port);
  });
}

main();
