// Forward capture: a function declared BEFORE a const it captures (the
// hoisted-handler shape) — the binding hoists to scope entry (TDZ) and the
// closure reads it through the shared box after initialization; a call
// before initialization throws Node's catchable ReferenceError.

// The portless shape: cleanup references handlers declared below it and is
// only called after they exist.
function wire(): string[] {
  const events: string[] = [];
  const cleanup = () => {
    events.push("cleanup:" + onSigInt() + "," + onSigTerm());
    return events.length;
  };
  const onSigInt = () => "SIGINT".toLowerCase();
  const onSigTerm = () => "sigterm";
  events.push("wired:" + onSigTerm());
  cleanup();
  cleanup();
  return events;
}
const log = wire();
for (const line of log) console.log(line);

// Forward-captured non-function types: string and record.
function banner(): string {
  const render = () => `${title} v${meta.version}`;
  const title = "scr";
  const meta = { version: 3 };
  return render();
}
console.log(banner());

// TDZ trap: calling the capturing function BEFORE the const initializes
// throws ReferenceError with Node's exact message, catchably.
function early(run: boolean): string {
  const read = () => tail + "!";
  if (run) {
    try {
      return read();
    } catch (e) {
      if (e instanceof Error) {
        return `${e.name}: ${e.message}`;
      }
      return "not-an-error";
    }
  }
  const tail = "late";
  return read();
}
console.log(early(true));
console.log(early(false));

// Per-invocation binding: each call gets a fresh box.
function fresh(n: number): number {
  const get = () => bag.length;
  const bag = [n, n + 1];
  return get() + bag[0]!;
}
console.log(fresh(5), fresh(10));

// The capture threads through TWO function layers before the declaration.
function deep(): string {
  const outer = () => {
    const inner = () => marker;
    return inner();
  };
  const marker = "deep-marker";
  return outer();
}
console.log(deep());
