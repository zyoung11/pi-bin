// npm imports in a STATIC build: every value import reports the
// requires-dynamic diagnostic naming the package, and each reached use of
// a package-declared value reports per site — attributed to the package,
// never the type name. Type-only imports are free.
import { Calc, origin } from "mathkit";
import { convert } from "@acme/units";
import type { Vector } from "mathkit";

const point: Vector = { x: 3, y: 4 };
console.log(point.x);

const calc = new Calc(1);
console.log(calc.value());
console.log(convert(3, "km"));
console.log(origin.x);
