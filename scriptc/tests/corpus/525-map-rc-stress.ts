// Reference-counting stress for maps: heavy set/delete/clear churn with
// string keys and refcounted values, overwrite storms, forEach-heavy
// workloads, and maps of maps-adjacent structures. The sanitized lane's
// RC audit (strings, arrays, records, objects, unions, maps all counted)
// must end at zero.
const m = new Map<string, string>();
for (let round = 0; round < 20; round = round + 1) {
  for (let i = 0; i < 50; i = i + 1) {
    m.set(`k${i}`, `v${round}:${i}`);
  }
  for (let i = 0; i < 50; i = i + 2) {
    m.delete(`k${i}`);
  }
}
console.log(m.size);
let sample = m.get("k1");
if (sample !== undefined) {
  console.log(sample);
}
m.clear();
console.log(m.size);

// overwrite storm: every set releases the previous record value
interface Blob {
  data: string;
  n: number;
}
const one = new Map<string, Blob>();
for (let i = 0; i < 1000; i = i + 1) {
  one.set("slot", { data: `payload ${i}`, n: i });
}
const last = one.get("slot");
if (last !== undefined) {
  console.log(last.n, one.size);
}

// forEach-heavy churn: delete + re-add inside callbacks, repeatedly. The
// value ceiling terminates the walk (an unconditional delete + re-add of
// the CURRENT key would loop forever — in Node too: re-added entries are
// live-visited at their new end position).
const churn = new Map<number, number>();
for (let i = 0; i < 32; i = i + 1) {
  churn.set(i, i);
}
for (let round = 0; round < 30; round = round + 1) {
  churn.forEach((v, k) => {
    if (k % 2 === 0 && v < 40) {
      churn.delete(k);
      churn.set(k, v + 1);
    }
  });
}
console.log(churn.size);
const c0 = churn.get(0);
if (c0 !== undefined) {
  console.log(c0);
}

// many short-lived maps (allocation/release churn)
function burst(n: number): number {
  let total = 0;
  for (let i = 0; i < n; i = i + 1) {
    const t = new Map<string, number[]>();
    t.set("xs", [i, i + 1]);
    const xs = t.get("xs");
    if (xs !== undefined) {
      total = total + xs.length;
    }
  }
  return total;
}
console.log(burst(500));

// maps captured by closures, released when the closure drops
function makeCounter(): (key: string) => number {
  const counts = new Map<string, number>();
  return (key: string): number => {
    const cur = counts.get(key);
    const next = cur === undefined ? 1 : cur + 1;
    counts.set(key, next);
    return next;
  };
}
const c1 = makeCounter();
const c2 = makeCounter();
console.log(c1("a"), c1("a"), c1("b"), c2("a"));

// a map handed around through deep call chains
function layer3(x: Map<string, number>): number {
  x.set("deep", 3);
  return x.size;
}
function layer2(x: Map<string, number>): number {
  x.set("mid", 2);
  return layer3(x);
}
function layer1(): number {
  const x = new Map<string, number>();
  x.set("top", 1);
  return layer2(x);
}
console.log(layer1());
