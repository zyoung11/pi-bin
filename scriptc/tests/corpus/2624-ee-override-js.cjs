// The JS lane's emit override: unannotated parameters (checker any) still
// lower in the forwarding shape — the event name binds as the string it
// always is, filtering and instance state work, and unannotated listeners
// ride the checked-dynamic registration like any JS listener.
const { EventEmitter } = require("node:events");

class Q extends EventEmitter {
  constructor() {
    super();
    this.n = 0;
  }
  emit(event, ...args) {
    this.n++;
    if (event === "skip") return false;
    console.log("fwd:" + event);
    return super.emit(event, ...args);
  }
}

const q = new Q();
q.on("a", (x) => console.log("got", x));
console.log(q.emit("a", 41));
console.log(q.emit("skip"));
q.once("b", (s, m) => console.log("once", s, m));
q.emit("b", "hi", 2);
q.emit("b", "again", 3);
console.log(q.n, q.listenerCount("a"));
