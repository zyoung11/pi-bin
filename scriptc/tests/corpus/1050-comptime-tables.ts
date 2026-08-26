// comptime lookup tables: the callback runs at COMPILE time (real JS in the
// compiler's Node process) and the returned array is baked into the binary
// as a literal, then used by ordinary runtime code.
const squares = comptime(() => {
  const t: number[] = [];
  for (let i = 0; i < 16; i++) {
    t.push(i * i);
  }
  return t;
});
console.log(squares.length, squares[0], squares[7], squares[15]);

let sum = 0;
for (const s of squares) {
  sum += s;
}
console.log("sum", sum);

// The island is real JavaScript: closures, helper functions, while loops.
const popcounts = comptime(() => {
  const popcount = (n: number): number => {
    let bits = 0;
    let x = n;
    while (x > 0) {
      bits += x % 2;
      x = (x - (x % 2)) / 2;
    }
    return bits;
  };
  const out: number[] = [];
  for (let i = 0; i < 8; i++) {
    out.push(popcount(i));
  }
  return out;
});
console.log(popcounts.join(","));

// Baked arrays are ordinary runtime arrays: mutation, identity, methods.
squares.push(256);
console.log(squares.length, squares.indexOf(49), squares.includes(256));
const doubled = squares.map((n) => n * 2);
console.log(doubled[16]);

// Scalar results: numbers (including -0 riding a literal), booleans.
const folded = comptime(() => {
  let acc = 1;
  for (let i = 1; i <= 10; i++) {
    acc = (acc * 31 + i) % 9973;
  }
  return acc;
});
const negZero = comptime(() => -0);
const isEven = comptime(() => 123456 % 2 === 0);
console.log(folded, negZero, 1 / negZero, isEven);
