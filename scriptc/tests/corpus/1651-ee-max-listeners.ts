// Per-instance max listeners: the 10 default, setMaxListeners chaining,
// 0 = unlimited (no warning below), and instance isolation. Warning
// TEXT is exercised by the @exit fixture (its pid can never byte-match).
import { EventEmitter } from "node:events";

const e = new EventEmitter();
console.log(e.getMaxListeners());
console.log(e.setMaxListeners(3).getMaxListeners());

const unlimited = new EventEmitter().setMaxListeners(0);
for (let i = 0; i < 20; i++) unlimited.on("many", () => {});
console.log(unlimited.getMaxListeners(), unlimited.listenerCount("many"));

const other = new EventEmitter();
console.log(other.getMaxListeners());
