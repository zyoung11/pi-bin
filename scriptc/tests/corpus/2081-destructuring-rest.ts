// Destructuring REST in declaration and parameter positions: array rest
// slices a fresh tail, tuple rest packs FRESH under the checker's own
// rest type (an array when positions widen, a tuple record when they stay
// heterogeneous), nested rest patterns destructure the packed copy, and
// object rest copies the unconsumed fields into a fresh record at
// destructure time — JS's CopyDataProperties is a fresh object too, so
// source mutation after the destructure never reaches the rest binding.
const pair: [number, string] = [7, "x"];
const [p, ...restTail] = pair;
console.log(p, restTail[0]);
const trip: [number, string, boolean] = [1, "s", true];
const [h1, ...tail2] = trip;
console.log("tail2", tail2[0], tail2[1]);
var [...a5] = [1, 2, 3];
var [x14, ...a6] = [1, 2, 3];
console.log(a5.length, x14, a6.length, a6[0]);
const [...[n1, n2]] = [10, 20] as number[];
console.log("nested", n1, n2);
const obj = { x: 1, y: "two", z: true };
const { x, ...others } = obj;
console.log(x, others.y, others.z, JSON.stringify(others));
const { ...empty } = {};
console.log("empty", JSON.stringify(empty));
const base = { m: 1, n: 2, o: 3 };
const { m: gone, ...frozen } = base;
base.n = 99;
console.log("fresh", gone, frozen.n, frozen.o);
// Parameter rest patterns (object rest in a lambda param).
const call = (o: { foo: string; bar: string }, cb: (val: { foo: string; bar: string }) => void): void => cb(o);
call({ foo: "f", bar: "b" }, ({ foo, ...rest }) => {
  console.log(foo, rest.bar);
});
// for-of heads pack rest per pass.
const array = [{ a: 0, b: 1 }];
for (const { a, ...rest } of array) console.log("forof", a, rest.b);
