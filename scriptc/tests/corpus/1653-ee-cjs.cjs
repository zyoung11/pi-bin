// The CJS lane: require('events') IS the class (with the .EventEmitter
// self-reference), zero-parameter listeners carry the whole surface, and
// instanceof agrees across both require spellings.
"use strict";
const EventEmitter = require("events");
const { EventEmitter: Twin } = require("node:events");

const e = new EventEmitter();
let ticks = 0;
e.on("tick", () => { ticks += 1; });
e.once("tick", () => { ticks += 10; });
e.emit("tick");
e.emit("tick");
console.log("ticks:", ticks, e.listenerCount("tick"));

const t = new Twin();
console.log(t instanceof EventEmitter, e instanceof Twin);
console.log(JSON.stringify(e.eventNames()));
e.removeAllListeners();
console.log(e.emit("tick"), JSON.stringify(e.eventNames()));
