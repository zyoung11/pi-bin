// Utility types over data shapes (Partial, Record with literal keys, Pick,
// Omit, Readonly, intersections) resolve to the SAME structural record
// shapes as their longhand spellings — the mapped-type result and the
// written-out object type intern to one struct, so values flow freely in
// both directions with no coercion (shape identity, not width subtyping).
type Config = { host: string; port: number };
type Longhand = { host?: string; port?: number };

// Partial<Config> and the longhand optional spelling are ONE shape:
// round-trip a value through both annotations, both directions.
function describePartial(p: Partial<Config>): string {
  if (p.host !== undefined) {
    return "host=" + p.host;
  }
  return "no host";
}
function describeLonghand(p: Longhand): string {
  if (p.port !== undefined) {
    return "port=" + p.port;
  }
  return "no port";
}
const viaLonghand: Longhand = { host: "alpha" };
const viaPartial: Partial<Config> = { port: 8080 };
console.log(describePartial(viaLonghand));
console.log(describeLonghand(viaPartial));
console.log(describePartial(viaPartial));
console.log(describeLonghand(viaLonghand));

// Partial literals omit fields like any optional-field literal; writes flip
// between the value arm and undefined.
const grows: Partial<Config> = {};
console.log(grows.host === undefined, grows.port === undefined);
grows.host = "later";
grows.port = 9;
if (grows.host !== undefined && grows.port !== undefined) {
  console.log(grows.host, grows.port + 1);
}
grows.host = undefined;
console.log(grows.host === undefined);

// Record with a finite union of literal keys is a concrete shape: field
// reads, writes, compound assignment, and reference semantics all apply.
const pair: Record<"a" | "b", number> = { a: 1, b: 2 };
console.log(pair.a + pair.b);
pair.a = 10;
pair.b += 5;
console.log(pair.a, pair.b);
const alias: Record<"a" | "b", number> = pair;
alias.a = 100;
console.log(pair.a, alias === pair);

// Record values can be records themselves.
const nested: Record<"left" | "right", { label: string }> = {
  left: { label: "L" },
  right: { label: "R" },
};
console.log(nested.left.label + nested.right.label);

// Pick and Omit results as function parameters — and their shape identity
// with the equivalent longhand.
function takesPick(p: Pick<Config, "host">): string {
  return "pick:" + p.host;
}
function takesOmit(o: Omit<Config, "port">): string {
  return "omit:" + o.host;
}
const justHost: { host: string } = { host: "shared" };
console.log(takesPick(justHost));
console.log(takesOmit(justHost));
console.log(takesPick({ host: "inline" }), takesOmit({ host: "inline2" }));

// Readonly<T> maps exactly like T (writes are tsc errors — reads only).
const frozen: Readonly<Config> = { host: "ro", port: 443 };
console.log(frozen.host, frozen.port);
function takesReadonly(c: Readonly<Config>): number {
  return c.port * 2;
}
console.log(takesReadonly({ host: "h", port: 21 }));
// A plain Config value flows into the Readonly slot: same shape.
const plain: Config = { host: "rw", port: 1 };
console.log(takesReadonly(plain));

// Intersections of object types resolve to the merged shape.
type A = { a: number };
type B = { b: string };
const ab: A & B = { a: 7, b: "seven" };
console.log(ab.a, ab.b);
function takesMerged(v: { a: number; b: string }): string {
  return v.b + ":" + v.a;
}
console.log(takesMerged(ab));
const merged: { a: number; b: string } = { a: 8, b: "eight" };
function takesIntersection(v: A & B): string {
  return v.b + ":" + v.a;
}
console.log(takesIntersection(merged));

// Utility types compose: Partial over an intersection, Pick out of a
// Partial result.
const pab: Partial<A & B> = { a: 3 };
console.log(pab.a !== undefined, pab.b === undefined);
function takesPickedPartial(v: Pick<Partial<Config>, "host">): boolean {
  return v.host === undefined;
}
console.log(takesPickedPartial({}), takesPickedPartial({ host: "x" }));
