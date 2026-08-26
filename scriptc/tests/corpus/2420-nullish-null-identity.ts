// x ?? null on a T | null value keeps the null arm — the identity default does not fold the union away, and the guard after it still unwraps.
interface V { readonly v: number; }
function f(q: V | null): number {
  const picked = q ?? null;
  if (picked === null) return -1;
  return picked.v;
}
function g(m: number | null): number {
  const picked = m ?? null;
  if (picked === null) return -1;
  return picked + 1;
}
console.log(f({ v: 6 }));
console.log(f(null));
console.log(g(0));
console.log(g(null));
