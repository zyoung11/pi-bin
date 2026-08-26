// eventNames() over streams: Node pre-creates each stream class's known
// _events keys at construction (a V8 shape optimization), so those names
// list BEFORE user events even when the user listener registered first —
// while remaining invisible until a listener actually lands. Plain
// EventEmitters keep pure first-registration order, removal deletes the
// key, and a re-add appends at the end. Node is the oracle.
import { EventEmitter } from "node:events";
import { Duplex, Readable, Writable } from "node:stream";

const noop = (): void => {};

// Plain emitter: pure insertion order, no reserved names.
const e = new EventEmitter();
e.on("b", noop);
e.on("a", noop);
e.on("error", noop);
console.log("plain", JSON.stringify(e.eventNames()));

// Readable: close/error/data/end/readable rank first, in that order.
const r = new Readable({ read() {} });
console.log("r-initial", r.eventNames().length);
r.on("foo", noop);
r.on("data", noop);
r.on("error", noop);
console.log("readable", JSON.stringify(r.eventNames()));

// Writable: close/error/prefinish/finish/drain.
const w = new Writable({ write(_c, _e, cb) { cb(); } });
console.log("w-initial", w.eventNames().length);
w.on("foo", noop);
w.on("drain", noop);
w.on("prefinish", noop);
console.log("writable", JSON.stringify(w.eventNames()));

// Duplex: the union — writable trio before the readable trio.
const d = new Duplex({ read() {}, write(_c, _e, cb) { cb(); } });
console.log("d-initial", d.eventNames().length);
d.on("foo", noop);
d.on("finish", noop);
d.on("data", noop);
console.log("duplex", JSON.stringify(d.eventNames()));

// Shape mode (pre-created keys): removeListener KEEPS an emptied name's
// rank — Node writes events[type] = undefined instead of deleting — so a
// re-add lands back at its old position.
const r2 = new Readable({ read() {} });
r2.on("data", noop);
r2.on("zed", noop);
console.log("before-remove", JSON.stringify(r2.eventNames()));
r2.removeListener("data", noop);
console.log("after-remove", JSON.stringify(r2.eventNames()));
r2.on("data", noop);
console.log("after-readd", JSON.stringify(r2.eventNames()));
// ...even when the drain empties the whole emitter (shape never resets
// through removeListener).
r2.removeListener("data", noop);
r2.removeListener("zed", noop);
r2.on("foo", noop);
r2.on("data", noop);
console.log("after-drain", JSON.stringify(r2.eventNames()));

// Plain emitters DELETE the key on removal: the re-add appends at the end.
const e2 = new EventEmitter();
e2.on("a", noop);
e2.on("b", noop);
e2.removeListener("a", noop);
e2.on("a", noop);
console.log("plain-readd", JSON.stringify(e2.eventNames()));

// The named removeAllListeners deletes a POPULATED key even in shape mode.
const r3 = new Readable({ read() {} });
r3.on("data", noop);
r3.on("x", noop);
r3.removeAllListeners("data");
r3.on("data", noop);
console.log("rmall-named", JSON.stringify(r3.eventNames()));

// The no-argument wipe resets everything and leaves shape mode: 'error'
// re-added after user events appends in plain insertion order.
const r4 = new Readable({ read() {} });
r4.on("a", noop);
r4.on("data", noop);
r4.removeAllListeners();
r4.on("b", noop);
r4.on("error", noop);
console.log("after-wipe", JSON.stringify(r4.eventNames()));
