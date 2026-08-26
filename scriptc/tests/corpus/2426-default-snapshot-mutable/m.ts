// `export default <mutable identifier>` — Node SNAPSHOTS the value when the
// export statement runs; later writes to the let stay invisible through the
// importer's default binding (the named exports below stay LIVE).
let v = 1;
v = v + 1;
export default v;
export function bump(): void {
  v = 99;
}
export function read(): number {
  return v;
}
