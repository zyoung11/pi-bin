// Destructuring in function/method parameters — the options-object
// pattern: element defaults, whole-pattern defaults, tuple and array
// patterns, arrows, methods, and rest-pattern parameters.
interface Opts {
  port?: number;
  host?: string;
  secure?: boolean;
}
function serve({ port = 80, host = "localhost", secure = false }: Opts = {}): string {
  return `${secure ? "https" : "http"}://${host}:${port}`;
}
console.log(serve());
console.log(serve({ port: 8443, secure: true }));
console.log(serve({ host: "example.test" }));

// A default reading an earlier binding of the same pattern.
function span({ from = 0, to = from + 10 }: { from?: number; to?: number }): string {
  return `${from}..${to}`;
}
console.log(span({}));
console.log(span({ from: 5 }));
console.log(span({ from: 2, to: 4 }));

// Tuple parameter patterns (the .map(([k, v]) => ...) shape).
const entries: [string, number][] = [["a", 1], ["b", 2]];
console.log(entries.map(([k, v]) => `${k}=${v}`).join("&"));

// Array parameter patterns with rest.
function tailLen([, ...rest]: number[]): number {
  return rest.length;
}
console.log(tailLen([1, 2, 3, 4]));

// Nested parameter patterns.
function describe({ id, meta: { tag } }: { id: number; meta: { tag: string } }): string {
  return `${id}:${tag}`;
}
console.log(describe({ id: 7, meta: { tag: "x" } }));

// Methods and constructors take patterns too.
class Server {
  private prefix: string;
  constructor({ prefix = ">" }: { prefix?: string } = {}) {
    this.prefix = prefix;
  }
  log({ level, msg }: { level: string; msg: string }): void {
    console.log(`${this.prefix}[${level}] ${msg}`);
  }
}
new Server().log({ level: "info", msg: "up" });
new Server({ prefix: "$" }).log({ level: "warn", msg: "slow" });
