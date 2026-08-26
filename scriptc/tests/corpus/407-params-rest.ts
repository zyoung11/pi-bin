// Rest parameters: each call site packs its surplus arguments into one
// fresh array — zero, one, or many, mixed with required params.
function sum(...xs: number[]): number {
  let total = 0;
  for (const x of xs) total += x;
  return total;
}
console.log(sum(), sum(5), sum(1, 2, 3, 4));

function join(sep: string, ...parts: string[]): string {
  return parts.join(sep);
}
console.log(join("-"));
console.log(join("-", "a"));
console.log(join("+", "a", "b", "c"));

// The packed array is a real array: length, indexing, for-of, methods.
function describe(label: string, ...xs: number[]): string {
  let out = label + "(" + xs.length + ")";
  for (const x of xs) out += " " + x;
  if (xs.length > 0) out += " first=" + xs[0];
  return out;
}
console.log(describe("empty"));
console.log(describe("some", 10, 20, 30));

// Each call gets a FRESH array (mutations never leak across calls).
function takeAndGrow(...xs: string[]): number {
  xs.push("extra");
  return xs.length;
}
console.log(takeAndGrow(), takeAndGrow("a"), takeAndGrow("a", "b"));

// Rest of strings: refcounted elements move into the pack per call.
function shout(...words: string[]): string {
  let s = "";
  for (const w of words) s += w + "!";
  return s;
}
let acc = "";
for (let i = 0; i < 3; i++) {
  acc = shout(acc, "n" + i, "go");
}
console.log(acc);

// Rest on methods, through direct and virtual dispatch.
class Collector {
  seen: number = 0;
  add(...xs: number[]): number {
    this.seen += xs.length;
    return this.seen;
  }
}
class DoubleCollector extends Collector {
  add(...xs: number[]): number {
    this.seen += xs.length * 2;
    return this.seen;
  }
}
const col: Collector = new DoubleCollector();
console.log(col.add(), col.add(1), col.add(1, 2, 3));

// Rest mixed with optional/default params: the omittable middle completes,
// the tail packs.
function report(name: string, level: string = "info", ...notes: string[]): string {
  return name + "[" + level + "]" + (notes.length > 0 ? " " + notes.join(";") : "");
}
console.log(report("app"));
console.log(report("app", "warn"));
console.log(report("app", "warn", "n1", "n2"));
console.log(report("app", undefined, "n1"));

// Expression arguments evaluate left-to-right into the pack.
function trace(n: number): number {
  console.log("arg " + n);
  return n;
}
console.log(sum(trace(1), trace(2), trace(3)));
