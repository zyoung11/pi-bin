// Async METHODS: class instance methods (fiber-spawned with `this` as
// param 0), static methods, and object-literal methods — all statically
// dispatched (override chains stay fenced), with Node's microtask order
// observable: the sync tail runs before any await resumes.

class Counter {
  n: number;
  constructor(n: number) {
    this.n = n;
  }
  async bump(by: number): Promise<number> {
    this.n += by;
    return this.n;
  }
  async chain(): Promise<number> {
    const a = await this.bump(1);
    const b = await this.bump(10);
    return a + b;
  }
  async explode(): Promise<number> {
    throw new Error("kaboom");
  }
  static async make(n: number): Promise<number> {
    const c = new Counter(n);
    return await c.bump(2);
  }
}

async function thisFree(x: number): Promise<number> {
  return x + 100;
}

const ops = {
  async double(x: number): Promise<number> {
    return x * 2;
  },
  async describe(x: number) {
    const d = await thisFree(x);
    return `desc:${d}`;
  },
};

async function main(): Promise<void> {
  const c = new Counter(5);
  console.log("bump", await c.bump(3));
  console.log("chain", await c.chain());
  console.log("static", await Counter.make(40));
  console.log("obj", await ops.double(21));
  console.log(await ops.describe(7));

  // A method's promise is a value before it is awaited; the method body
  // already ran to its first suspension (eager start, like async fns).
  const p = c.bump(1000);
  console.log("typeof", typeof p);
  console.log("late", await p);

  // Rejections propagate through method frames like function frames.
  try {
    await c.explode();
  } catch (e) {
    console.log("caught", (e as Error).message);
  }
}

main();
console.log("sync tail");
