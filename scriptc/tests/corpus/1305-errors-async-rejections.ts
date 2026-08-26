// Error objects through async rejections: a thrown Error inside an async
// body rejects the promise, the rejection re-throws at the awaiter, and a
// typed catch narrows it with instanceof — payload intact (name, message,
// added fields) across the fiber boundary. Ordering is Node's:
// synchronous prefixes run first, rejections surface at the await.
class FetchError extends Error {
  status: number;
  constructor(status: number) {
    super(`fetch failed with ${status}`);
    this.name = "FetchError";
    this.status = status;
  }
}

function delay(ms: number): Promise<number> {
  return new Promise<number>((resolve) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
}

async function fetchThing(ok: boolean): Promise<string> {
  await delay(1);
  if (!ok) throw new FetchError(500);
  return "payload";
}

async function guarded(ok: boolean): Promise<string> {
  try {
    return await fetchThing(ok);
  } catch (e) {
    if (e instanceof FetchError) {
      return `handled ${e.status}: ${e.message}`;
    }
    throw e;
  }
}

async function main(): Promise<void> {
  console.log(await guarded(true));
  console.log(await guarded(false));
  // A rejection awaited TWICE re-throws the SAME error object each time.
  const p = fetchThing(false);
  for (let i = 0; i < 2; i = i + 1) {
    try {
      await p;
    } catch (e) {
      if (e instanceof Error) console.log("again", i, e.name);
    }
  }
  // Non-Error rejections keep their primitive payloads.
  const q = (async (): Promise<number> => {
    await delay(1);
    throw "not an error";
  })();
  try {
    await q;
  } catch (e) {
    if (typeof e === "string") console.log("primitive", e);
  }
}
main();
