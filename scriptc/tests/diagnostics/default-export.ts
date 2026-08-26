// The default-export family's residual fence: `export =` assignments (the
// CommonJS-interop spelling — no ESM analogue exists to lower it to).
// Default-exporting a MUTABLE binding — this fixture's previous subject —
// GRADUATED: `export default someLet` now registers Node's snapshot (the
// value when the export statement runs; corpus 2426 pins the split against
// the live `export { x as default }` spelling).
const counter = 0;
export = counter;
