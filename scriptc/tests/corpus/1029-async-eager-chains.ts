// Regression pin: an async function that eagerly spawns ANOTHER async
// function keeps its own exception context when the child finishes. The
// whole chain here settles synchronously (no timers, no suspensions), so
// every catch/throw below runs on a fiber that just returned from a nested
// eager spawn — the shape that once leaked a rejection into the wrong
// context and exited 1 despite every rejection being handled.
class ChainError extends Error {
  hop: number;
  constructor(hop: number) {
    super(`hop ${hop}`);
    this.name = "ChainError";
    this.hop = hop;
  }
}

async function boom(): Promise<number> {
  throw new ChainError(0);
}

async function middle(): Promise<number> {
  try {
    return await boom();
  } catch (e) {
    if (e instanceof ChainError) {
      throw new ChainError(e.hop + 1); // reject upward with a fresh error
    }
    throw e;
  }
}

async function rethrower(): Promise<number> {
  try {
    return await middle();
  } catch (e) {
    throw e; // exact rethrow across the fiber boundary
  }
}

async function main(): Promise<void> {
  try {
    await rethrower();
  } catch (e) {
    if (e instanceof ChainError) console.log("settled", e.name, e.message, e.hop);
  }
  // Same shape with string payloads (no error objects involved).
  const p = (async (): Promise<string> => {
    try {
      await (async (): Promise<string> => {
        throw "inner";
      })();
      return "no";
    } catch {
      throw "outer";
    }
  })();
  try {
    await p;
  } catch (e) {
    if (typeof e === "string") console.log("string chain", e);
  }
  console.log("clean exit");
}
main();
