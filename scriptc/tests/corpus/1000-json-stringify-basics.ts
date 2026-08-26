// JSON.stringify of primitives, records, arrays, and nesting — differential
// against Node, so output must be byte-exact.
//
// Record fields serialize in DECLARED order — JS insertion order, exactly
// Node (1880-json-declared-field-order pins the non-alphabetical cases).
// This file's fields happen to be alphabetical; that is no longer load-
// bearing, just this file's historical layout.

// Primitives.
console.log(JSON.stringify(1));
console.log(JSON.stringify(1.5), JSON.stringify(-2.25), JSON.stringify(0));
console.log(JSON.stringify(true), JSON.stringify(false));
console.log(JSON.stringify("plain"), JSON.stringify(""));

// JS number edge cases: NaN and ±Infinity stringify as null; -0 as "0";
// big/small magnitudes use the same JS-exact formatting as String(x).
console.log(JSON.stringify(0 / 0), JSON.stringify(1 / 0), JSON.stringify(-1 / 0));
console.log(JSON.stringify(-0));
console.log(JSON.stringify(1e21), JSON.stringify(1e-7), JSON.stringify(0.1 + 0.2));

// Records (fields alphabetical — see convention above).
const point = { label: "origin", x: 0, y: -1.5 };
console.log(JSON.stringify(point));

// Arrays, empty and nested.
const nums: number[] = [];
console.log(JSON.stringify(nums));
nums.push(1);
nums.push(2.5);
console.log(JSON.stringify(nums));
console.log(JSON.stringify([true, false]));
console.log(JSON.stringify(["a", "b", "c"]));
const grid: number[][] = [[1, 2], [], [3]];
console.log(JSON.stringify(grid));

// Records nesting records and arrays.
const cfg = {
  debug: true,
  name: "svc",
  ports: [80, 443],
  server: { host: "example.com", port: 8080 },
};
console.log(JSON.stringify(cfg));

// stringify results are ordinary strings.
const s = JSON.stringify(point);
console.log(s.length, s.includes('"x":0'));

// Round-trip: parse what we stringified, extract, re-stringify.
type Point = { label: string; x: number; y: number };
const back = JSON.parse(JSON.stringify(point)) as Point;
console.log(back.label, back.x, back.y);
console.log(JSON.stringify(back));
