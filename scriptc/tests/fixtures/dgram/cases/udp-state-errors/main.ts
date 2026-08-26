import { createSocket } from "node:dgram";
import * as dns from "node:dns";

const s = createSocket({ type: "udp4" });
s.on("listening", () => console.log("ev: listening"));
s.on("connect", () => console.log("ev: connect"));
s.on("close", () => console.log("ev: close"));
s.bind(0, "127.0.0.1", () => {
  console.log("bound");
  try {
    s.bind(0, "127.0.0.1");
  } catch (e) {
    if (e instanceof Error) console.log("bind again:", e.message);
  }
  const b = createSocket({ type: "udp4" });
  b.on("error", (err) => {
    console.log("bind error prefix ok:", err.message.startsWith("bind EADDRINUSE 127.0.0.1:"));
    b.close();
    s.connect(9, "127.0.0.1", () => {
      console.log("connected");
      try {
        s.connect(9, "127.0.0.1");
      } catch (e) {
        if (e instanceof Error) console.log("connect again:", e.message);
      }
      s.close(() => console.log("close cb"));
      dns.lookup("host-that-cannot-exist.invalid", { family: 4 }, (err2, address2) => {
        if (err2) {
          console.log("lookup err:", err2.message);
          return;
        }
        console.log("unexpected", address2);
      });
    });
  });
  b.bind(s.address().port, "127.0.0.1");
});
console.log("main done");
