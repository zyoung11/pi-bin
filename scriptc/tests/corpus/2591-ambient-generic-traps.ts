// Ambient-undefined roots through GENERIC-signature chains: Node erases
// `declare const/let/var` and body-less `declare function` entirely, so the
// FIRST runtime step of any chain rooted there is the catchable
// ReferenceError "<name> is not defined" — whatever the declared type, and
// before any member, type argument, or call argument evaluates. `?.` cannot
// guard it: the optional chain only guards null/undefined AFTER a
// successful root read.

interface Y {
  foo<T>(this: T, arg: keyof T): void;
  a: number;
}
declare const value: Y | undefined;
declare let TabGroup: <T>(props: { idx: number }) => T;
declare function chain<T>(t: T): { map<U>(f: (x: T) => U): U };
declare const o6: <T>() => undefined | { x: number };
declare const parse: <def>(def: def) => def;

// Optional-chained generic method call on an ambient root.
try {
  value?.foo("a");
} catch (e) {
  console.log("1", (e as Error).name, (e as Error).message);
}

// A generic call signature on an ambient `declare let`.
try {
  TabGroup({ idx: 0 });
} catch (e) {
  console.log("2", (e as Error).name, (e as Error).message);
}

// A method chain THROUGH an ambient function's call result: the callee
// read dies first; the arguments (a lambda here) never evaluate.
try {
  chain(1).map((x) => x + 1);
} catch (e) {
  console.log("3", (e as Error).name, (e as Error).message);
}

// An instantiation-expression call plus an optional element access.
try {
  o6<number>()?.["x"];
} catch (e) {
  console.log("4", (e as Error).name, (e as Error).message);
}

// A TRAP declaration: the initializer's root throws, so the binding never
// holds a value and the catch owns the unwind.
try {
  const r = parse([{ a: "foo" }]);
  console.log("never", r);
} catch (e) {
  console.log("5", (e as Error).name, (e as Error).message);
}

// An assignment whose RHS roots at an ambient name: the RHS evaluates
// first — the statement IS the root's throw.
declare let f1: <T>(x: Array<T>) => T[];
declare let f2: <U>(x: Array<U>) => U[];
try {
  f1 = f2;
} catch (e) {
  console.log("6", (e as Error).name, (e as Error).message);
}

console.log("done");
