// Destructuring PATTERN parameters: `([label, value]) => ...` and
// `({ x, y }) => ...` — the ABI slot carries the source value and the
// callee prologue desugars the reads through the same machinery as
// declaration destructuring (nested patterns included). The models-table
// pattern from a real CLI, verbatim shapes.
const rows: [string, string][] = [
  ["Input", "$3.00"],
  ["Output", "$15.00"],
  ["Cache read", "$0.30"],
];
const widths = rows.map(([label]) => label.length);
console.log(widths.join(","));
const lines = rows.map(([label, value]) => `${label}=${value}`);
for (const line of lines) console.log(line);

// Record patterns, renames, and nesting.
interface Point {
  x: number;
  y: number;
  tag: string;
}
const pts: Point[] = [
  { x: 1, y: 2, tag: "a" },
  { x: 3, y: 5, tag: "b" },
];
console.log(pts.map(({ x, y }) => x * y).join(","));
console.log(pts.map(({ tag: t, x }) => `${t}:${x}`).join(","));

// Function declarations and nested patterns take the same path.
function span([lo, hi]: [number, number]): number {
  return hi - lo;
}
console.log(span([3, 10]));

function describe({ tag, x }: Point, scale: number): string {
  return `${tag}@${x * scale}`;
}
console.log(describe(pts[1], 10));

function nested([{ x }, [a, b]]: [Point, [number, number]]): number {
  return x + a + b;
}
console.log(nested([pts[0], [10, 20]]));

// Destructured names are ordinary mutable parameter locals.
function bump([n]: [number]): number {
  n = n + 1;
  return n;
}
console.log(bump([41]));

// Array (non-tuple) sources index like declaration destructuring.
const pairs: number[][] = [
  [1, 2],
  [3, 4],
];
console.log(pairs.map(([a, b]) => a + b).join(","));

// A lambda value with a pattern param called through a variable.
const dot = ([a, b]: [number, number]): number => a * b;
console.log(dot([6, 7]));
