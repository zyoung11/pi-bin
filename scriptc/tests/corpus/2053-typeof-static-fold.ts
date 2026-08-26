// typeof on statically-typed values constant-folds to the JS answer —
// including COMPUTED operands (f64 arithmetic and string concatenation
// are unobservable, so dropping the evaluation changes nothing).
const t1 = 10;
const t2 = 3;
console.log(typeof (t1 ** t2 ** t1));
console.log(typeof (t1 + t2 * 2));
console.log(`${typeof (t1 ** t2)} in a template`);
console.log(`${"x" + typeof (t1 ** t2 ** t1)}`);
console.log(typeof ("a" + "b"));
console.log(typeof (t1 > t2));
console.log(typeof [1, 2]);
console.log(typeof { a: 1 });
const f = (n: number): number => n + 1;
console.log(typeof f);
console.log(typeof undefined);
console.log(typeof null);
let u: string | number = 5;
console.log(typeof u);
u = "s";
console.log(typeof u);
