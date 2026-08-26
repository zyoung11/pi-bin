// Generic functions as VALUES: alias bindings register the target (calls
// through any alias hop monomorphize like the target's own name), pinned
// references share the same instance table, and annotated bindings whose
// type keeps the type parameters behave exactly like the unannotated
// alias.
function id<T>(x: T): T {
  return x;
}

// A bare alias, an alias chain, and calls at several instantiations.
const h = id;
const h2 = h;
console.log(h(3), h("z"), h2(true), h2([1, 2]).length);

// An alias annotated with the still-generic signature.
const keep: <T>(x: T) => T = id;
console.log(keep(41) + 1, keep("q"));

// A concrete-annotated binding PINS one signature (the value story): the
// closure and the alias's instances come from one shared table.
const pinned: (s: string) => string = h;
console.log(pinned("p"));

// Contextual pinning at an argument position, through the alias.
function apply(f: (n: number) => number, v: number): number {
  return f(v);
}
console.log(apply(h, 7), apply(id, 8));

// Aliases work at block scope too (no captures are involved — instances
// are module functions of the target).
function scoped(): number {
  const local = id;
  return local(9);
}
console.log(scoped());

// An alias of a generic ARROW binding (not a declaration).
const arrow = <T,>(v: T): T => v;
const arrowAlias = arrow;
console.log(arrowAlias("arrow"), arrowAlias(6) * 2);

// Aliased generic with several params and a constrained parameter.
function tag<T extends { name: string }, U>(t: T, u: U): string {
  return `${t.name}:${String(u)}`;
}
const tagged = tag;
console.log(tagged({ name: "n", extra: 1 }, 5), tagged({ name: "m" }, true));
