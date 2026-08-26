// The union re-tag composed with per-arm width lifts: a whole union flows
// into a wider union where a RECORD or ARRAY arm has no identical
// destination arm but width-lifts into exactly one (SEMANTICS.md 36's
// findRoute rule, extended past single records).
type Full = { id: string; n: number };

// An ARRAY arm reshaping per element inside the re-tag.
function search(flag: boolean): Full[] | undefined {
  return flag ? [{ id: "a", n: 1 }, { id: "b", n: 2 }] : undefined;
}
const hitList: { id: string }[] | undefined = search(true);
const ids: string[] = [];
if (hitList !== undefined) for (const h of hitList) ids.push(h.id);
console.log(hitList === undefined ? "none" : ids.join(","));
const missList: { id: string }[] | undefined = search(false);
console.log(missList === undefined ? "none" : "some");

// The shipped single-record-arm direction still composes (regression pin).
function findRoute(flag: boolean): { hostname: string; port: number; extra?: string } | undefined {
  return flag ? { hostname: "h", port: 80, extra: "e" } : undefined;
}
const route: { hostname: string; port: number } | undefined = findRoute(true);
console.log(route === undefined ? "none" : `${route.hostname}:${route.port}`);

// Discriminated arms each width-lift into their one matching destination.
type A = { kind: "a"; a: string; extra: number };
type B = { kind: "b"; b: number };
function make(which: boolean): A | B {
  return which ? { kind: "a", a: "x", extra: 1 } : { kind: "b", b: 7 };
}
for (const which of [true, false]) {
  const v: { kind: "a"; a: string } | { kind: "b"; b: number } = make(which);
  if (v.kind === "a") console.log("a", v.a);
  else console.log("b", v.b);
}

// A NESTED-width arm: the record arm's own field narrows inside the lift.
type Node2 = { label: string; inner: { keep: string; drop: number } };
function nested(flag: boolean): Node2 | undefined {
  return flag ? { label: "L", inner: { keep: "k", drop: 3 } } : undefined;
}
const nv: { label: string; inner: { keep: string } } | undefined = nested(true);
console.log(nv === undefined ? "none" : `${nv.label}/${nv.inner.keep}`);
