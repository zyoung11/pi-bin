// Generic members monomorphize per call site in every member form: instance fields initialized with generic arrows (async included — the Output.time idiom), async generic methods, and async generic statics; `this` inside the field arrow is the instance.
class Output {
  debugEnabled: boolean;
  spinnerCount = 0;
  constructor(debug: boolean) {
    this.debugEnabled = debug;
  }
  debug = (msg: string) => {
    if (this.debugEnabled) console.log(`[debug] ${msg}`);
  };
  time = async <T,>(label: string, fn: () => Promise<T>): Promise<T> => {
    this.debug(`start ${label}`);
    const r = await fn();
    this.debug(`end ${label}`);
    return r;
  };
  pick = <T,>(a: T, b: T, first: boolean): T => (first ? a : b);
  wrap = function <T>(x: T): T[] {
    return [x];
  };
}
class Client {
  depth = 0;
  async withCancel<T>(run: () => Promise<T>): Promise<T> {
    this.depth++;
    try {
      return await run();
    } finally {
      this.depth--;
    }
  }
  static async lift<T>(v: T): Promise<T[]> {
    return [v];
  }
}
async function main(): Promise<void> {
  const out = new Output(true);
  const n = await out.time("num", async () => 41 + 1);
  console.log(n + 1);
  const s = await out.time("str", async () => "hi");
  console.log(s.toUpperCase());
  console.log(out.pick("a", "b", false), out.pick(1, 2, true));
  console.log(out.wrap("x").length, out.wrap(5)[0]);
  const c = new Client();
  console.log(await c.withCancel(async () => "nested"), c.depth);
  console.log(await c.withCancel(async () => 7), c.depth);
  const lifted = await Client.lift("only");
  console.log(lifted.join(","), (await Client.lift(3))[0]);
}
main();
