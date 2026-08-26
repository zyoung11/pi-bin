// Zero-parameter timer callbacks whose RETURN isn't void — the stream2
// self-rescheduling `function push() { ... return r.push(null); }` shape
// (an inferred union return), plain value returns, and async callbacks
// (func()=>promise). JS ignores a timer callback's return value; the
// lowering adapts through a return-dropping wrapper. Every one of these
// was an SC9001 ICE (libCall timers.setTimeout arg 0: expected
// func()=>void, got func()=>union / func()=>promise). Phases chain
// explicitly so the printed order never races real timer cadences.
const order: string[] = [];

// The stream2 shape: conditional returns infer boolean | undefined, and
// the callback re-arms itself through the same adapted spelling.
let pushes = 0;
function push(): boolean | undefined {
  order.push(`push${pushes}`);
  if (pushes++ === 2) {
    setTimeout(tick, 1);
    return true;
  }
  setTimeout(push, 1);
}

// A plain non-void return, dropped.
function tick(): string {
  order.push("tick");
  setTimeout(later, 1);
  return "ignored";
}

// An async callback: the returned promise is fire-and-forget.
async function later() {
  await null;
  order.push("later");
  setImmediate(beat);
}

// The same family through setImmediate, process.nextTick, setInterval.
let beats = 0;
function beat(): number {
  order.push(`beat${beats}`);
  if (beats++ === 0) {
    process.nextTick(beat);
    return 0;
  }
  intervalHandle = setInterval(intervalBeat, 1);
  return 42;
}

// setInterval with a NAMED non-void callback (an arrow's contextual type
// is already ()=>void — the named function keeps its own signature).
let intervalHandle: ReturnType<typeof setInterval> | null = null;
function intervalBeat(): number {
  order.push("interval");
  if (intervalHandle !== null) clearInterval(intervalHandle);
  console.log(order.join(","));
  return beats;
}

setTimeout(push, 1);
console.log("armed");
