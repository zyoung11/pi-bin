// Promise executor reject parameters: `new Promise((resolve, reject) => ...)`
// binds reject as a real closure rejecting the promise. Node-exact
// settlement: first settle wins (reject-after-resolve and double reject are
// no-ops), a synchronous reject before the executor returns works, the
// rejection re-throws at the awaiter with the Error payload intact
// (instanceof, name, message), and reject escapes the executor into later
// callbacks (the probe-socket idiom).
class ProbeError extends Error {
  code: string;
  constructor(code: string) {
    super(`probe failed: ${code}`);
    this.name = "ProbeError";
    this.code = code;
  }
}

// Synchronous reject before return.
function syncReject(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    reject(new Error("no route to host"));
  });
}

// Reject after resolve: a no-op — the promise stays fulfilled.
function rejectAfterResolve(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    resolve("won");
    reject(new Error("late loser"));
  });
}

// Resolve after reject: a no-op — the promise stays rejected.
function resolveAfterReject(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    reject(new ProbeError("EHOSTUNREACH"));
    resolve("late winner");
  });
}

// Double reject: the first reason wins.
function doubleReject(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    reject(new Error("first"));
    reject(new Error("second"));
  });
}

// Throw after reject: swallowed, like throw-after-resolve.
function rejectThenThrow(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    reject(new Error("kept"));
    throw new Error("swallowed");
  });
}

// reject ESCAPES the executor into a later callback — the lan-ip probe
// shape: an async event decides settlement after the executor returned.
function deferredSettle(ok: boolean): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    setTimeout(() => {
      if (ok) {
        resolve("connected");
      } else {
        reject(new ProbeError("ECONNREFUSED"));
      }
    }, 1);
  });
}

async function main(): Promise<void> {
  try {
    await syncReject();
    console.log("unreachable");
  } catch (e) {
    if (e instanceof Error) console.log(`sync: ${e.name}: ${e.message}`);
  }

  console.log(`after-resolve: ${await rejectAfterResolve()}`);

  try {
    await resolveAfterReject();
  } catch (e) {
    if (e instanceof ProbeError) console.log(`after-reject: ${e.code} (${e.message})`);
  }

  try {
    await doubleReject();
  } catch (e) {
    if (e instanceof Error) console.log(`double: ${e.message}`);
  }

  try {
    await rejectThenThrow();
  } catch (e) {
    if (e instanceof Error) console.log(`throw-after: ${e.message}`);
  }

  console.log(`deferred-ok: ${await deferredSettle(true)}`);
  try {
    await deferredSettle(false);
  } catch (e) {
    if (e instanceof ProbeError) console.log(`deferred-err: ${e.code}`);
  }

  // The catch METHOD sees the same reason.
  const viaCatch = await syncReject().catch((e) => `caught(${e instanceof Error ? e.message : "?"})`);
  console.log(viaCatch);
}

main();
