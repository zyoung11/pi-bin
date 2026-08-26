// Destructuring ASSIGNMENT to existing bindings over STATIC sources,
// statement position: object patterns take defaults (the undefined-arm
// test against the target's own type) and rest (the unconsumed fields
// pack fresh); array-literal targets are the positional twin — holes
// skip, defaults carry the bounds test, rest packs the tail. Empty
// patterns still evaluate their source once.
const a: { x?: number } = {};
let x = 0;
({ x = 1 } = a);
console.log("x", x);
let y = 5;
({ y = 1 } = { y: 2 });
console.log("y", y);
let ren = 0;
({ q: ren = 7 } = {} as { q?: number });
console.log("ren", ren);
let bar: { m: number; n: string } = { m: 0, n: "" };
let first = 0;
({ first, ...bar } = { first: 9, m: 3, n: "s" });
console.log("bar", first, bar.m, bar.n);
let s = ""; let n = 0;
[s, n] = ["hi", 42] as [string, number];
console.log("sn", s, n);
let h = 0; let t: number[] = [];
[h, ...t] = [1, 2, 3];
console.log("ht", h, t.length, t[0], t[1]);
let d1 = 0; let d2 = 0;
[d1 = 10, , d2 = 20] = [1] as number[];
console.log("d", d1, d2);
let evals = 0;
const mk = (): number[] => { evals++; return [1]; };
[] = mk();
console.log("evals", evals);
