// Function overload declarations are type-world: the N signature lines
// lower to NOTHING and only the implementation compiles. tsc resolved
// every call site against the signatures; the arguments flow through the
// implementation's ABI (its parameter types are supersets — unions and
// optionals — of each overload's, by the overload-compatibility rules).
function describe(x: string): string;
function describe(x: number, upper: boolean): string;
function describe(x: string | number, upper?: boolean): string {
  const base = typeof x === "string" ? "str:" + x : "num:" + String(x);
  return upper === true ? base.toUpperCase() : base;
}

console.log(describe("hi"));
console.log(describe(7, true));
console.log(describe(8, false));

// Ambient overload SET with no implementation anywhere: every reference
// is Node's exact catchable ReferenceError at the use site (the ambient
// `declare const` / ambient-namespace undefRead stance).
declare function vanish(x: string): number;
declare function vanish(x: number): string;

try {
  vanish("gone");
} catch (e) {
  if (e instanceof Error) console.log("ambient overloads:", e.name + ": " + e.message);
}

// NESTED overload signatures are type-world too — the implementation's
// statement declares the local (nested functions are values, so the
// implementation keeps exact arity), calls flow through its ABI.
function outer(): string {
  function inner(a: string): string;
  function inner(a: number): string;
  function inner(a: string | number): string {
    return typeof a === "string" ? a : "n" + String(a);
  }
  return inner("one") + "|" + inner(2);
}
console.log(outer());

// An overloaded function as a VALUE keeps JS identity where the
// implementation's signature is exact-arity: the closure interns per
// declaration, so `pick === pick` holds like in Node.
function pick(x: "a"): string;
function pick(x: "b"): number;
function pick(x: "a" | "b"): string | number {
  return x === "a" ? "alpha" : 42;
}
console.log(pick("a"), pick === pick);
