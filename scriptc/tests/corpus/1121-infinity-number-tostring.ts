// The Infinity global as a real literal value (and -Infinity via unary
// minus), and radix-free n.toString() as the one static number formatter —
// String(n), `${n}`, and n.toString() are byte-identical.

// The accumulator pattern Infinity exists for.
const xs = [3.5, 1.25, 2];
let best = Infinity;
let worst = -Infinity;
for (const v of xs) {
  if (v < best) best = v;
  if (v > worst) worst = v;
}
console.log(best, worst);

// Formatting and comparisons.
console.log(Infinity, -Infinity, String(Infinity), `${-Infinity}`);
console.log(Infinity > 1e308, -Infinity < 0, Infinity === Infinity);

// Arithmetic: IEEE semantics match JS exactly.
console.log(Infinity + 1, Infinity * -2, 1 / Infinity, -1 / Infinity);
console.log(Infinity - Infinity, Infinity / Infinity, 0 * Infinity);

// Infinity flows like any number: fields, params, arrays.
function clamp(v: number, hi: number): number {
  return v > hi ? hi : v;
}
console.log(clamp(5, Infinity), clamp(Infinity, 10));
const lims = { lo: -Infinity, hi: Infinity };
console.log(lims.lo < -1e300, lims.hi > 1e300);
const seq = [1, Infinity, -Infinity];
console.log(seq.join("|"));

// Number.isFinite over the literal.
console.log(Number.isFinite(Infinity), Number.isFinite(42));

// Radix-free toString: every formatter shape through one conversion.
console.log((0).toString(), (123.456).toString(), (-7.5).toString());
console.log((1e21).toString(), (1e-7).toString(), (-0).toString());
console.log((0.1 + 0.2).toString());
console.log(Infinity.toString(), (-Infinity).toString(), (0 / 0).toString());
function pad(ms: number): string {
  const t = ~~(ms / 1000);
  const rem = t % 60;
  const two = rem < 10 ? "0" + rem.toString() : rem.toString();
  return `${~~(t / 60)}:${two}`;
}
console.log(pad(65000), pad(5000));
