// switch on UNION-typed discriminants: desugared to the per-union
// strict-equality chain — lazy source-order tests, grouped cases, default
// in any position, unit-arm cases (undefined/null), narrowing in case
// bodies, and continue/return/throw exits all behave exactly like Node.

function cap(t: string | undefined): string {
  const out: string[] = [];
  switch (t) {
    case "language":
      out.push("text");
      break;
    case "image":
      out.push("image");
      break;
    case "video":
    case "speech":
      out.push("av");
      break;
    case undefined:
      out.push("none");
      break;
    default:
      out.push("other");
      break;
  }
  return out.join(",");
}
for (const t of ["language", "image", "video", "speech", "weird", undefined] as (string | undefined)[]) {
  console.log(String(t), cap(t));
}

// Return-terminated cases; null arm; number arms with JS equality.
function pick(n: number | null): string {
  switch (n) {
    case 1:
      return "one";
    case 2:
      return "two";
    case null:
      return "null";
    case 0:
      return "zero";
  }
  return "other";
}
console.log(pick(1), pick(2), pick(null), pick(9), pick(0), pick(-0));

// default BEFORE cases (JS tests every case first; default runs last).
function mid(v: string | null): string {
  switch (v) {
    default:
      return "dflt";
    case "a":
      return "A";
    case null:
      return "NIL";
  }
}
console.log(mid("a"), mid(null), mid("zzz"));

// continue exits a case straight to the next loop pass; the loop-side
// bookkeeping matches Node.
const kinds: (string | undefined)[] = ["skip", "take", undefined, "take"];
let taken = 0;
for (const k of kinds) {
  switch (k) {
    case "skip":
    case undefined:
      continue;
    case "take":
      taken++;
      break;
    default:
      break;
  }
}
console.log(taken);

// throw-terminated case, caught outside.
function must(v: string | undefined): string {
  switch (v) {
    case undefined:
      throw new Error("missing");
    default:
      return v;
  }
}
console.log(must("ok"));
try {
  must(undefined);
} catch (e) {
  console.log(e instanceof Error ? e.message : "?");
}

// Narrowing in case bodies: after `case undefined` the other branch sees
// the string arm.
function tally(v: string | undefined): number {
  switch (v) {
    case undefined:
      return -1;
    default:
      return v.length;
  }
}
console.log(tally(undefined), tally("abc"));

// Record-armed unions switch on their unit arm too.
interface Cfg {
  port: number;
}
function port(c: Cfg | null): number {
  switch (c) {
    case null:
      return 0;
    default:
      return c.port;
  }
}
console.log(port(null), port({ port: 8080 }));

// An empty trailing case matches and does nothing.
function quiet(v: string | undefined): string {
  let r = "ran";
  switch (v) {
    case "x":
      r = "X";
      break;
    case undefined:
  }
  return r;
}
console.log(quiet("x"), quiet(undefined), quiet("y"));
