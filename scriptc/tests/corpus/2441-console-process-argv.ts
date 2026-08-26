// console.log(process.argv) — the string[] report shape. argv[0]/argv[1]
// VALUES differ between Node and scriptc (documented divergence; length
// and positions match), so the fixture normalizes the two entries through
// argv's own mutability (ONE interned array, like Node) before printing
// the array itself.
const argv = process.argv;
console.log(argv.length);
argv[0] = "runtime";
argv[1] = "program";
console.log(process.argv);
argv.push("--flag", "value");
console.log(process.argv);
console.log(process.argv.slice(2));
