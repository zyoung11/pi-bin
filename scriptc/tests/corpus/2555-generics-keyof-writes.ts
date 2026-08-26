// keyof-constrained WRITES: `o[k] = v` inside a generic instance whose K
// is bound to one literal compiles to a static field write, exactly like
// the read side; literal-typed key consts outside generics take the same
// rule.
function set<T, K extends keyof T>(o: T, k: K, v: T[K]): void {
  o[k] = v;
}

const obj = { a: 1, b: "two", c: false };
set(obj, "a", 5);
set(obj, "b", "five");
set(obj, "c", true);
console.log(obj.a, obj.b, obj.c);

// Read-modify-write through the same instance machinery.
function bump<T, K extends keyof T>(o: T, k: K, f: (v: T[K]) => T[K]): void {
  o[k] = f(o[k]);
}
bump(obj, "a", (n) => n * 10);
bump(obj, "b", (s) => s + "!");
console.log(obj.a, obj.b);

// A literal-typed key const writes statically outside any generic.
const ka: "a" = "a";
obj[ka] = 99;
console.log(obj[ka]);

// Distinct literal instantiations write distinct fields — a swap spelled
// as two per-literal calls. (A single call with a literal-UNION key stays
// fenced: a runtime-keyed write needs an index signature.)
const pt = { x: 1, y: 2 };
function put<T, K extends keyof T>(o: T, k: K, v: T[K]): void {
  o[k] = v;
}
const tmp = pt.x;
put(pt, "x", pt.y);
put(pt, "y", tmp);
console.log(pt.x, pt.y);
