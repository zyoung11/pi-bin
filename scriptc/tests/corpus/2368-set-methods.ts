// ES2025 Set methods: union / intersection / difference /
// symmetricDifference build fresh sets in the spec's insertion orders
// (intersection walks the smaller side), and the three predicates answer
// at the first counterexample. Number and string elements, empty sets,
// self-application, and results feeding further set operations.
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5]);
console.log([...a.union(b)].join(","));
console.log([...b.union(a)].join(","));
console.log([...a.intersection(b)].join(","));
console.log([...a.difference(b)].join(","), [...b.difference(a)].join(","));
console.log([...a.symmetricDifference(b)].join(","), [...b.symmetricDifference(a)].join(","));
console.log(a.isSubsetOf(b), new Set([3, 4]).isSubsetOf(a), a.isSupersetOf(new Set([2, 3])), a.isSupersetOf(b));
console.log(a.isDisjointFrom(new Set([9, 10])), a.isDisjointFrom(b), new Set<number>().isDisjointFrom(a));
// The smaller-side walk decides intersection's insertion order.
const big = new Set([1, 2, 3, 4, 5, 6]);
const small = new Set([6, 1]);
console.log([...big.intersection(small)].join(","), [...small.intersection(big)].join(","));
console.log([...big.symmetricDifference(small)].join(","));
// Strings, chaining, and the empty edges.
const s1 = new Set(["x", "y"]);
const s2 = new Set(["y", "z"]);
console.log([...s1.union(s2)].join("|"), s1.union(s2).size);
console.log([...s1.union(s2).intersection(new Set(["z", "q"]))].join("|"));
const empty = new Set<number>();
console.log([...empty.union(new Set([7]))].join(","), empty.isSubsetOf(a), a.isSubsetOf(empty), empty.isSubsetOf(empty));
console.log([...a.union(a)].join(","), a.isSubsetOf(a), a.isDisjointFrom(a), [...a.symmetricDifference(a)].length);
// Mutating a result leaves the operands alone (fresh sets).
const u = a.union(b);
u.add(99);
console.log(u.size, a.size, b.size);
// SameValueZero at the boundary: NaN meets NaN, -0 meets +0.
const nan = 0 / 0;
const nn = new Set([nan, 1]);
console.log(nn.intersection(new Set([nan])).size, new Set([-0]).isSubsetOf(new Set([0])));
