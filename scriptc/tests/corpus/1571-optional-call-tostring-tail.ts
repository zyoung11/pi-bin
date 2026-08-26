// The number.toString STATIC formatter as an optional-chain TAIL step:
// `process.getuid?.()?.toString()` — the guarded call's number result takes
// the same radix-10 lowering as a plain `n.toString()`, and the tail short-
// circuits to undefined when the guarded step is nullish (the service.ts
// user-context shape).
const uid = process.getuid?.()?.toString();
console.log("uid string:", typeof uid === "string" && uid.length > 0);
console.log("uid digits:", uid !== undefined && /^[0-9]+$/.test(uid));

const gid = process.getgid?.()?.toString();
console.log("gid digits:", gid !== undefined && /^[0-9]+$/.test(gid));

// The same tail over a user-defined optional method: nullish receivers
// short-circuit past the toString step entirely.
type Probe = { get?: () => number };
function probe(x: boolean): Probe {
  return x ? { get: () => 42.5 } : {};
}
console.log(`${probe(true).get?.()?.toString()}`);
console.log(`${probe(false).get?.()?.toString()}`);

// A guarded RECEIVER with a plain toString tail: the ?. belongs to the
// member step, and the formatter still fires on the narrowed number.
function maybeNum(x: boolean): number | undefined {
  return x ? 1e21 : undefined;
}
console.log(`${maybeNum(true)?.toString()}`);
console.log(`${maybeNum(false)?.toString()}`);
