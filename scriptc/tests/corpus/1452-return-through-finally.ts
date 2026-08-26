// `return` crossing a `finally`: the finally runs BEFORE the function
// returns, the return value is computed FIRST (finally mutations of the
// returned local are invisible), nested finallys run inner-to-outer, a
// throw in a finally replaces the pending return, and returns inside catch
// bodies cross too.

// Value snapshotting: the finally mutates the local AFTER the return value
// was computed — Node returns the OLD value.
function snapshot(): number {
  let x = 1;
  try {
    return x;
  } finally {
    x = 99;
    console.log("finally ran, x =", x);
  }
}
console.log("snapshot:", snapshot());

// Refcounted return value (string), built in the try.
function strThrough(tag: string): string {
  let s = "start";
  try {
    s = s + "-" + tag;
    return s;
  } finally {
    console.log("cleanup", tag);
    s = "clobbered";
  }
}
console.log(strThrough("a"), strThrough("b"));

// Nested finallys: inner runs first, then outer, then the return lands.
function nested(): string {
  try {
    try {
      return "value";
    } finally {
      console.log("inner finally");
    }
  } finally {
    console.log("outer finally");
  }
}
console.log("nested:", nested());

// Return from inside a loop inside the try; the finally still runs once.
function fromLoop(arr: number[]): number {
  try {
    for (const v of arr) {
      if (v > 10) return v;
    }
    return -1;
  } finally {
    console.log("loop cleanup");
  }
}
console.log(fromLoop([1, 20, 3]), fromLoop([1, 2, 3]));

// Return inside CATCH with finally.
function fromCatch(): string {
  try {
    throw new Error("boom");
  } catch {
    return "caught";
  } finally {
    console.log("catch-path finally");
  }
}
console.log(fromCatch());

// A throw in the finally REPLACES the pending return.
function replaced(): string {
  try {
    try {
      return "pending";
    } finally {
      throw new Error("replacer");
    }
  } catch (e) {
    if (e instanceof Error) return "replaced by " + e.message;
    return "?";
  }
}
console.log(replaced());

// Bare return (void) through a finally.
function bare(flag: boolean): void {
  try {
    if (flag) return;
    console.log("no return taken");
  } finally {
    console.log("void cleanup", flag);
  }
}
bare(true);
bare(false);

// Union-typed return through a finally (the real-CLI decodeAudio shape).
function unionThrough(hit: boolean): { n: number } | null {
  try {
    if (hit) return { n: 7 };
    return null;
  } finally {
    console.log("union cleanup");
  }
}
const u1 = unionThrough(true);
if (u1 === null) console.log("null");
else console.log(u1.n);
const u2 = unionThrough(false);
if (u2 === null) console.log("null");
else console.log(u2.n);

// Async variant: return crossing a finally inside an async function, with
// awaits in the try body — the fiber path.
async function step(n: number): Promise<number> {
  return n * 2;
}
async function asyncThrough(xs: number[]): Promise<number | null> {
  try {
    for (const x of xs) {
      const doubled = await step(x);
      if (doubled > 10) return doubled;
    }
  } finally {
    console.log("async cleanup");
  }
  return null;
}
async function main(): Promise<void> {
  const a1 = await asyncThrough([2, 9, 4]);
  if (a1 === null) console.log("null");
  else console.log(a1);
  const a2 = await asyncThrough([1, 2]);
  if (a2 === null) console.log("null");
  else console.log(a2);

  // Async: throw in finally over a pending return, caught by the awaiter.
  async function asyncReplaced(): Promise<string> {
    try {
      return "pending";
    } finally {
      throw new Error("async replacer");
    }
  }
  try {
    console.log(await asyncReplaced());
  } catch (e) {
    if (e instanceof Error) console.log("await caught:", e.message);
  }
}
main();

// Array return value through two finallys — RC stress under the audit.
function arrThrough(): string[] {
  const out: string[] = [];
  try {
    try {
      out.push("x");
      out.push("y");
      return out;
    } finally {
      out.push("inner-after-return-computed");
    }
  } finally {
    console.log("outer arr cleanup, len", out.length);
  }
}
console.log(arrThrough().join(","));
