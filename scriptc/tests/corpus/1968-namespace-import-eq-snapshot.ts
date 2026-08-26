// @transform-types
// import= aliases of MUTABLE members: Node's transform emits
// `var a1 = m.a` — a SNAPSHOT taken at the alias statement — so later
// writes to m.a are invisible through the alias, while qualified reads
// stay live. export import inside namespace blocks rides the same
// storage.
export namespace m {
  export var a = 10;
}
export import a1 = m.a;
import a2 = m.a;
console.log(a1 + a2);
m.a = 99;
console.log(a1, a2, m.a);
export namespace m1 {
  export import a3 = m.a;
  console.log(a3, m.a);
}
console.log(m1.a3);
