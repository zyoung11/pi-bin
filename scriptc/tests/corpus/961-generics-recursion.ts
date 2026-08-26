// Generic recursion (same-key: len<T> calls itself with T — converges to one
// instance) and generic functions calling other generic functions with both
// their own type parameters and concrete types.
function len<T>(a: T[]): number {
  if (a.length === 0) {
    return 0;
  }
  a.pop();
  return 1 + len(a); // same-key recursive instantiation
}

function count2<T>(a: T[], b: T[]): number {
  return len(a) + len(b); // generic → generic with the caller's T
}

function describe<T>(x: T, tag: string): string {
  return `${tag}:${id(x)}`; // generic → generic, T threaded through
}

function id<T>(x: T): T {
  return x; // declared after its callers: hoisting works for generics too
}

console.log(len([1, 2, 3]), len(["a", "b"]), len([true]));
console.log(count2([1], [2, 3]), count2(["x", "y"], []));
console.log(describe(12, "num"), describe("s", "str"), describe(false, "bool"));

// Mutual generic recursion, converging keys.
function even<T>(a: T[]): boolean {
  if (a.length === 0) {
    return true;
  }
  a.pop();
  return odd(a);
}
function odd<T>(a: T[]): boolean {
  if (a.length === 0) {
    return false;
  }
  a.pop();
  return even(a);
}
console.log(even([1, 2, 3, 4]), odd(["a", "b", "c"]));

// A generic instantiated with a closure-typed T.
function callTwice<T>(f: (x: T) => T, x: T): T {
  return f(f(x));
}
console.log(callTwice((n: number) => n + 5, 1), callTwice((s: string) => s + "!", "go"));
