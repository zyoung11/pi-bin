// Enums across module boundaries: exported numeric/string/const enums fold
// at the importer's member reads exactly like local ones (the member symbol
// is one identity through the alias), ambient (declare) non-const enums
// have no runtime object — the member read throws Node's catchable
// ReferenceError — and enum member literal types work as annotations.
import { Color, Mode, Speed } from "./lib.ts";

declare enum Ghost {
  A = 1,
}

console.log(Color.Red, Color.Blue, Mode.ReadWrite, Speed.Fast);
console.log(Color[1], Color["Blue"]);
const c: Color = Color.Red;
const exact: Color.Blue = Color.Blue;
console.log(c === Color.Red, exact);
try {
  console.log(Ghost.A);
} catch (e) {
  const err = e as Error;
  console.log(err.name + ": " + err.message);
}
function describe(m: Mode): string {
  return m === Mode.ReadWrite ? "rw" : "other";
}
console.log(describe(Mode.ReadWrite), describe(Mode.Read));
