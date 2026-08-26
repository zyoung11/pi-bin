// dry-run of the planned corpus program under Node only
function failing(msg: string): Promise<string> {
  return new Promise<string>(() => {
    throw new Error(msg);
  });
}
function slow(v: string, ms: number): Promise<string> {
  return new Promise<string>((resolve) => setTimeout(() => resolve(v), ms));
}

async function main(): Promise<void> {
  // fulfilled path: the handler never runs, the value passes through
  const a = await slow("ok", 5).catch(() => "fallback");
  console.log("a:", a);
  // rejected path: the handler observes the reason through instanceof
  const b = await failing("boom").catch((e) => {
    if (e instanceof Error) return "caught:" + e.message;
    return "caught:non-error";
  });
  console.log("b:", b);
  // zero-param handler
  const c = await failing("x").catch(() => "zero");
  console.log("c:", c);
  // rethrow: the original reason arrives at the try/catch
  try {
    await failing("original").catch((e) => {
      console.log("rethrowing");
      throw e;
    });
  } catch (e) {
    if (e instanceof Error) console.log("rethrown:", e.message);
  }
  // finally: runs on both paths, value/rejection pass through
  const d = await slow("val", 5).finally(() => console.log("fin-1"));
  console.log("d:", d);
  try {
    await failing("efail").finally(() => console.log("fin-2"));
  } catch (e) {
    if (e instanceof Error) console.log("e:", e.message);
  }
}
main();
console.log("top");

// The models.ts pattern: the handler mutates a captured binding and
// rethrows; a fall-off-the-end handler resolves with undefined; a
// non-Error reason narrows through typeof.
let cached: string = "warm";
function failWith(v: number): Promise<number> {
  return new Promise<number>(() => {
    throw v;
  });
}
async function more(): Promise<void> {
  try {
    await failWith(7).catch((e) => {
      cached = "cleared";
      throw e;
    });
  } catch (e) {
    if (typeof e === "number") console.log("num-rethrow:", e, cached);
  }
  // fall off the end: annotate the handler `(): undefined =>` so the
  // result is string | undefined (a bare void handler types
  // 'string | void', which has no representation — the fence explains)
  const settled = new Promise<string>((resolve) => resolve("fine"));
  const r = await settled.catch((): undefined => {
    cached = "never-runs";
  });
  console.log("passthrough:", r === "fine", cached);
  const s = await failWith(1).catch((e): undefined => {
    if (typeof e === "number") console.log("observed:", e);
  });
  console.log("fell-off:", s === undefined);
  // statement position over Promise<void>
  async function chore(): Promise<void> {
    await failWith(2);
  }
  chore().catch(() => {
    console.log("swallowed");
  });
}
more();
