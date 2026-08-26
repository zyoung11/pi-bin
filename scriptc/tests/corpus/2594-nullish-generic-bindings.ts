// NULLISH generic bindings: `null as any` / `null!` under a type that keeps
// generic signatures. The binding provably holds its unit forever (every
// write is nullish too), so no storage exists and each read knows the
// value — member reads and generic-method calls compile to Node's exact
// TypeError, nullish-to-nullish flows compile to nothing.

type Cond = <T>() => T extends { a?: string } ? 0 : 1;
let a: Cond = null!;
let b: Cond = null!;
a = b; // nullish-to-nullish: nothing happens

interface I<T> {
  fn<K extends keyof T>(k: K): void;
}

const i: I<{ x: number }> = null as any;
try {
  i.fn("x");
} catch (e) {
  console.log("1", e instanceof TypeError, (e as Error).message);
}

// Propagation: a nullish binding initialized FROM a nullish binding.
const j: I<{ y: string }> = i;
try {
  j.fn("y");
} catch (e) {
  console.log("2", e instanceof TypeError, (e as Error).message);
}

// The undefined unit keeps its own message.
const u: I<{ z: boolean }> = undefined!;
try {
  u.fn("z");
} catch (e) {
  console.log("3", e instanceof TypeError, (e as Error).message);
}

console.log("done");
