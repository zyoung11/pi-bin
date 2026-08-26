// Object-literal accessors, the SHAPE story: accessor records as ordinary
// record values — held in arrays and Maps, as union arms behind
// discriminant narrowing, under the in-operator (accessor names answer as
// own members, getters NOT invoked), reference identity, optional chains,
// and a construction loop exercising the closure slots' retain/release.
// Node is the oracle byte-for-byte.

function makeCounter(start: number) {
  let v = start;
  return {
    id: start,
    get next() { v++; return v; },
    get current() { return v; },
  };
}

// containers hold accessor records like any record
const counters = [makeCounter(0), makeCounter(100)];
console.log(counters[0]!.next, counters[1]!.next, counters[0]!.current);

const byName = new Map<string, { id: number; get next(): number; get current(): number }>();
byName.set("a", counters[0]!);
console.log(byName.get("a")!.next, byName.get("a")!.id);

// union arms: discriminant narrowing reaches the accessor
type Source = { kind: "live"; get value(): number } | { kind: "fixed"; value: number };
function readSource(s: Source): number {
  if (s.kind === "live") return s.value;
  return s.value;
}
let ticks = 0;
const live: Source = { kind: "live", get value() { ticks += 2; return ticks; } };
const fixed: Source = { kind: "fixed", value: 9 };
console.log(readSource(live), readSource(fixed), readSource(live), ticks);

// in-operator: accessor names are own members — and the getter DOES NOT run
let probed = 0;
const probe = { plain: 1, get lazy() { probed++; return probed; } };
console.log("lazy" in probe, "plain" in probe, "ghost" in (probe as object), probed);

// reference identity: records compare by reference, accessors change nothing
const one = makeCounter(7);
const same = one;
console.log(one === same, one === makeCounter(7));

// optional chains dispatch the getter only when the receiver is present
function maybeCounter(want: boolean): { get current(): number } | undefined {
  return want ? makeCounter(50) : undefined;
}
console.log(`${maybeCounter(true)?.current} ${maybeCounter(false)?.current}`);

// construction churn: fresh accessor records per iteration, slots
// retained/released cleanly
let sum = 0;
for (let i = 0; i < 200; i++) {
  const c = makeCounter(i);
  sum += c.next;
  if (i % 2 === 0) sum += c.current;
}
console.log(sum);

// two literals of one shape keep independent captured state
const a = makeCounter(0);
const b = makeCounter(0);
a.next;
a.next;
console.log(a.current, b.current);
