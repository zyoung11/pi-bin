// The monomorphization frontier end-to-end: keyof-constrained functions,
// generic-function aliases, generic-signature bindings, and interface
// generic methods composing in one program.
type Getter = <T, K extends keyof T>(o: T, k: K) => T[K];
const getter: Getter = (o, k) => o[k];

interface Store {
  load<T>(mk: () => T): T;
}
class OnceStore implements Store {
  loads = 0;
  load<T>(mk: () => T): T {
    this.loads++;
    return mk();
  }
}

function pick<T, K extends keyof T>(o: T, k: K): T[K] {
  return o[k];
}
const pickAlias = pick;

const user = { name: "ada", age: 36 };
console.log(getter(user, "name"), getter(user, "age") + 1);
console.log(pickAlias(user, "age") * 2, pickAlias(user, "name").toUpperCase());

const s: Store = new OnceStore();
console.log(
  s.load(() => getter(user, "name")),
  s.load(() => pick(user, "age")),
  (s as OnceStore).loads,
);

// keyof through a generic-signature callback parameter.
function overKeys<T, K extends keyof T>(o: T, ks: K[], f: (o: T, k: K) => T[K]): string {
  let acc = "";
  for (const k of ks) acc += `${String(k)}=${String(f(o, k))};`;
  return acc;
}
const pt = { x: 1, y: 2 };
console.log(overKeys(pt, ["x", "y"], (o, k) => o[k]));
