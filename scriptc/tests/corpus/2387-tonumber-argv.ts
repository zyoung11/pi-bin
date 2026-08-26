// Number(aString) over argv-style input — the CLI idiom
// (`Number(process.argv[2])`): the args are pushed onto the REAL
// process.argv (one interned array on both sides) so the reads exercise
// exactly the runtime string path a user's flag parsing takes.
process.argv.push("42", "-3.5", " 7 ", "0x1f", "not-a-number", "", "1e3", "+.5");
const n = Number(process.argv[2]);
console.log(n, n + 1, Number.isNaN(n));
console.log(Number(process.argv[3]), Number(process.argv[4]));
console.log(Number(process.argv[5]), Number(process.argv[6]));
console.log(Number(process.argv[7]), Number(process.argv[8]), Number(process.argv[9]));

// The parsed values feed arithmetic and comparisons like real flag handling.
const port = Number(process.argv[2]);
const timeout = Number(process.argv[8]);
console.log(port > 0 && port < 65536, timeout * 2, port + timeout);

// A defaulting pattern: NaN from garbage falls back.
function intFlag(raw: string, fallback: number): number {
  const v = Number(raw);
  return Number.isNaN(v) ? fallback : v;
}
console.log(intFlag(process.argv[6], 100), intFlag(process.argv[4], 100), intFlag(process.argv[7], 8080));

// Cleanup so argv reads elsewhere would see the original shape.
for (let i = 0; i < 8; i++) process.argv.pop();
console.log(process.argv.length);
