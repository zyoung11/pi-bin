// The portless close-proxy idiom: wrapper.close is OVERRIDDEN to close an
// inner server too, reaching the real close through the bound origClose —
// `wrapper.close.bind(wrapper)` never re-consults the override, so the
// proxy-through cannot recurse.
import * as net from "node:net";

const inner = net.createServer((sock) => {
  sock.destroy();
});
const wrapper = net.createServer((sock) => {
  sock.destroy();
});

const origClose = wrapper.close.bind(wrapper);
wrapper.close = function (cb?: () => void) {
  console.log("override ran");
  inner.close();
  return origClose(cb);
} as typeof wrapper.close;

wrapper.on("close", () => {
  console.log("wrapper closed");
});
inner.on("close", () => {
  console.log("inner closed");
});

inner.listen(0, () => {
  wrapper.listen(0, () => {
    console.log("both listening");
    wrapper.close();
  });
});
