/* Phase-order pin: 'listening' (the listen callback) and the server
 * 'close' callback are next-turn events (Node: next tick / the close
 * phase; runtime: the net dispatch at the turn top) — both run before a
 * comfortably-later timer, and after the synchronous tail of main. The
 * timer is 50ms, not 0: a 0ms timer would RACE the close-phase hop in
 * Node on a slow machine, and the pin here is phase order, not speed. */
import { createServer } from "node:net";

setTimeout(() => console.log("timer"), 50);
const server = createServer();
server.listen(0, () => {
  console.log("listening");
  server.close(() => console.log("closed"));
});
console.log("main done");
