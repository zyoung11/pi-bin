// Thrown values of every refcounted kind: records, arrays, closures, class
// instances, and union values. catch is bindingless (the thrown value is
// discarded), so programs communicate through module state — the RC point is
// that the exception cell owns and releases each payload.
let events: string[] = [];

interface Fault {
  code: number;
  label: string;
}

class Widget {
  name: string;
  constructor(name: string) {
    this.name = name;
    if (name.length > 6) {
      events.push("ctor throwing for " + name);
      throw "name too long: " + name;
    }
  }
}

type Res = { kind: "ok"; value: number } | { kind: "err"; message: string };

function make(n: number): Res {
  if (n < 0) {
    return { kind: "err", message: "negative " + n };
  }
  return { kind: "ok", value: n * 3 };
}

function hurl(which: number): void {
  events.push("hurl " + which);
  if (which === 0) {
    const f: Fault = { code: 7, label: "record payload" };
    throw f;
  }
  if (which === 1) {
    throw ["a", "b", "c"];
  }
  if (which === 2) {
    throw (x: number): number => x + 1;
  }
  if (which === 3) {
    const r = make(11); // a union VALUE rides the exception cell whole
    throw r;
  }
  throw new Widget("tiny");
}

for (let i = 0; i < 5; i = i + 1) {
  try {
    hurl(i);
  } catch {
    events.push("took " + i);
  }
}
console.log(events.join(" | "));

// A throwing constructor: the half-built instance is released by unwinding.
try {
  const w = new Widget("enormous");
  console.log(w.name);
} catch {
  console.log("widget rejected");
}
const ok = new Widget("small");
console.log("built:", ok.name);
