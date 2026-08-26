// The find-miss regression, verbatim: `.find` misses give `number | undefined`, and comparing that against the null LITERAL is legal TS that is simply always false — the literal must never coerce into the union representation (the stranded-arm trap threw here while console widening had just made the program compile).
const xs = [1, 2, 3];
const hit = xs.find((x) => x > 2);
const miss = xs.find((x) => x > 10);
console.log(hit);
console.log(miss);
console.log(miss === undefined);
console.log(miss === null);
console.log(miss ?? -1);
console.log(xs.indexOf(9));
