// isNaN and Math.floor, static (no island, no --dynamic).
console.log(isNaN(0 / 0), isNaN(1), isNaN(Infinity), isNaN(-Infinity), isNaN(parseInt("nope")));
console.log(Math.floor(2.7), Math.floor(-2.7), Math.floor(2), Math.floor(-0.5), 1 / Math.floor(-0.5));
console.log(Math.floor(0 / 0), Math.floor(1 / 0), Math.floor(-1 / 0), Math.floor(0.999999));
console.log(Math.floor(9007199254740991.5), Math.floor(-9007199254740991.5));
// Composed through static code paths: conditions, unions, loops.
const xs = [1.9, -1.1, 0.5, 2.499];
let acc = 0;
for (const x of xs) acc += Math.floor(x);
console.log(acc);
const maybe: number | undefined = xs.length > 0 ? Math.floor(xs[0] * 10) : undefined;
console.log(maybe !== undefined ? maybe : -1, isNaN(acc) ? "nan" : "num");
