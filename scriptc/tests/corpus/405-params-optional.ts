// Optional parameters: omitted, present, and explicitly-undefined calls all
// reach ONE completed signature; the body narrows with === / !== undefined.
function greet(name?: string): string {
  if (name === undefined) {
    return "hello, stranger";
  }
  return "hello, " + name;
}
console.log(greet());
console.log(greet("ada"));
console.log(greet(undefined));

function count(a: number, b?: number, c?: number): number {
  let total = a;
  if (b !== undefined) total += b;
  if (c !== undefined) total += c;
  return total;
}
console.log(count(1), count(1, 2), count(1, 2, 3), count(1, undefined, 3));

// Optional params on methods, dispatched directly and virtually.
class Logger {
  prefix: string = "log";
  line(msg: string, level?: string): string {
    if (level === undefined) {
      return this.prefix + ": " + msg;
    }
    return this.prefix + "[" + level + "]: " + msg;
  }
}
class LoudLogger extends Logger {
  line(msg: string, level?: string): string {
    if (level === undefined) {
      return this.prefix + "! " + msg;
    }
    return this.prefix + "!!" + level + "!! " + msg;
  }
}
const quiet = new Logger();
console.log(quiet.line("start"));
console.log(quiet.line("start", "warn"));
const loud: Logger = new LoudLogger();
console.log(loud.line("boom"));
console.log(loud.line("boom", "err"));

// A lambda with an optional param may flow into a slot spelling the
// completed signature with a required `T | undefined` param.
const pick: (x: number | undefined) => number = (x?: number) => {
  return x === undefined ? -1 : x * 10;
};
console.log(pick(undefined), pick(7));

// Optional record-typed param: the undefined arm rides next to a ref arm.
function describe(p?: { x: number; y: number }): string {
  if (p === undefined) return "origin";
  return p.x + "," + p.y;
}
console.log(describe(), describe({ x: 3, y: 4 }));

// Optional string params keep refcounts straight when omitted and present.
function tag(a: string, b?: string): string {
  if (b === undefined) return a;
  return a + "-" + b;
}
let acc = "";
for (let i = 0; i < 3; i++) {
  acc = tag(acc + i, i % 2 === 0 ? undefined : "odd");
}
console.log(acc);
