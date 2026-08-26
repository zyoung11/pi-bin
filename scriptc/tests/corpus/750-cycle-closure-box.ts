// A closure stored back into a binding it captures: box(self) -> closure ->
// box(self). Direct self-recursion of a named function is compiled
// cycle-free (selfRef), so this builds the indirect form a cycle collector
// is actually needed for: `step` reads `self`, and `self` is assigned
// `step`. The printed values are ordinary liveness markers — the real
// assertion is the sanitized lane, where every dropped counter's cycle must
// be collected (naive refcounting would leak all of them).
function makeCounter(): () => number {
  let n = 0;
  let self: () => number = (): number => 0;
  const step = (): number => {
    n = n + 1;
    if (n > 3) {
      return n;
    }
    const again = self; // the shared box, holding `step` itself
    return again();
  };
  self = step;
  return step;
}

const c = makeCounter();
console.log(c());
console.log(c());

// Churn: create and drop enough cyclic counters to cross the collector's
// root-buffer threshold, so collection also runs mid-program.
let total = 0;
for (let i = 0; i < 300; i = i + 1) {
  const f = makeCounter();
  total = total + f();
}
console.log(total);
