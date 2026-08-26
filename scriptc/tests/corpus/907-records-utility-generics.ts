// Utility types inside GENERIC bodies: a monomorphized function whose
// parameters, locals, and return are Partial<T> or Readonly<T> compiles per
// instantiation to the same shapes the concrete spellings use — the shape
// interned inside the body is identical to the caller's, so values cross
// the call boundary in both directions with reference semantics intact.
type Config = { host: string; port: number };

function pickOne<T>(useFirst: boolean, a: Partial<T>, b: Partial<T>): Partial<T> {
  const chosen: Partial<T> = useFirst ? a : b;
  return chosen;
}

// Explicit type arguments.
const got = pickOne<Config>(true, { host: "x" }, {});
console.log(got.host !== undefined, got.port === undefined);
if (got.host !== undefined) {
  console.log("picked " + got.host);
}

// Inferred type arguments (no explicit <Config> anywhere on this call).
function stash<T>(v: Partial<T>): Partial<T> {
  const held: Partial<T> = v;
  return held;
}
const stashed = stash({ port: 7 } as Partial<Config>);
console.log(stashed.port !== undefined, stashed.host === undefined);

// Reference semantics survive the generic boundary: the returned value
// aliases the argument.
const original: Partial<Config> = { host: "same" };
const roundTripped = pickOne<Config>(true, original, {});
console.log(roundTripped === original);
roundTripped.port = 99;
console.log(original.port !== undefined);

// Readonly<T> maps exactly like T inside the body too.
function passRo<T>(v: Readonly<T>): Readonly<T> {
  const local: Readonly<T> = v;
  return local;
}
const ro = passRo<Config>({ host: "h", port: 2 });
console.log(ro.host, ro.port);

// Two instantiations of the same generic over different shapes.
type Point = { x: number; y: number };
const p = pickOne<Point>(false, { x: 1 }, { y: 2 });
console.log(p.x === undefined, p.y !== undefined);

// A generic over Partial<T> where T's fields are already optional or
// union-typed: Partial is idempotent over the undefined arm.
type Flexible = { name?: string; score: number | null };
const flex = stash<Flexible>({ score: null });
console.log(flex.name === undefined, flex.score !== undefined);
if (flex.score !== undefined && flex.score !== null) {
  console.log(flex.score);
} else {
  console.log("score is null or absent");
}
