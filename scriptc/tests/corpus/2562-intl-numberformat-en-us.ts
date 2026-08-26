// The composed en-US Intl.NumberFormat forms with default options —
// new Intl.NumberFormat("en-US").format(x), the callable spelling, and
// x.toLocaleString("en-US"). Rounding is half-up on the SHORTEST
// round-tripping decimal (ICU's rounding input): format(1.0005) is
// "1.001" although toFixed(3) answers "1.000" on the same double, and
// 1e23 prints the shortest form's zeros, not the double's exact
// expansion. Grouping, ±0, NaN/∞ texts, and the tiny/huge edges pin
// byte-identically against Node.
const nf = (x: number): string => new Intl.NumberFormat("en-US").format(x);

// Grouping and plain decimals.
console.log(nf(0), nf(1), nf(100), nf(1000), nf(10000), nf(999999), nf(-1000000));
console.log(nf(1234567.891), nf(-1234567.891), nf(123456789.9999), nf(0.5), nf(-0.4));

// The shortest-decimal rounding discriminators — (1.0005).toFixed(3)
// would answer "1.000" (exact-value rounding); format answers "1.001".
console.log(nf(1.0005), nf(1.0015), nf(123.4565), nf(7.995));
console.log(nf(0.0625), nf(999.9995), nf(0.1 + 0.2), nf(1.100000023841858));

// Signs, zeros, and the non-finite texts.
console.log(nf(-0), nf(NaN), nf(1 / 0), nf(-1 / 0), nf(-2.5));

// Tiny values collapse to ±0 or the smallest kept fraction digit.
console.log(nf(5e-4), nf(-5e-4), nf(0.00049), nf(1e-7), nf(-1e-7), nf(5e-324));

// Huge values keep full integer digits, grouped — the shortest form's
// zeros for 1e23 (the exact expansion would end ...611,392).
console.log(nf(1e21), nf(1e23), nf(9007199254740993));
console.log(nf(1.7976931348623157e308));

// The callable spelling constructs the same formatter.
console.log(Intl.NumberFormat("en-US").format(12345.678));

// Number.prototype.toLocaleString("en-US") is the same operation.
console.log((1234567.891).toLocaleString("en-US"), (0.0625).toLocaleString("en-US"), (-0).toLocaleString("en-US"));
const xs = [1234.5, -9876543.21, 0.5, 1e6];
console.log(xs.map((x) => x.toLocaleString("en-US")).join("|"));

// Composed results are ordinary strings.
const label = `total: ${nf(1234.5)} units`;
console.log(label, label.length, nf(42).padStart(8, "."));
