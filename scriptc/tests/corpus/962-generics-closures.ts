// Generics × closures: arrows passed to generic higher-order functions,
// capturing closures flowing through instantiated bodies, generic results
// captured by closures.
function apply<T, U>(f: (x: T) => U, x: T): U {
  return f(x);
}

function compose<T, U, V>(g: (y: U) => V, f: (x: T) => U): (x: T) => V {
  return (x: T) => g(f(x));
}

console.log(apply((n: number) => n * 3, 14));
console.log(apply((s: string) => s.length, "abcde"));
console.log(apply((b: boolean) => (b ? "yes" : "no"), true));

const inc = (n: number) => n + 1;
const show = (n: number) => `#${n}`;
const incThenShow = compose(show, inc);
console.log(incThenShow(41), incThenShow(0));

// A capturing arrow through a generic HOF: shared-binding semantics survive
// monomorphization.
let counter = 0;
function times<T>(n: number, f: (x: T) => T, seed: T): T {
  let acc = seed;
  for (let i = 0; i < n; i++) {
    acc = f(acc);
  }
  return acc;
}
console.log(
  times(4, (s: string) => {
    counter++;
    return s + "*";
  }, "|"),
);
console.log(counter);
console.log(times(3, (n: number) => n * 2, 1), counter);

// Generic function result captured by a closure created inside another call.
function constant<T>(v: T): () => T {
  return () => v;
}
const cNum = constant(123);
const cStr = constant("fixed");
console.log(cNum(), cStr(), cNum());
