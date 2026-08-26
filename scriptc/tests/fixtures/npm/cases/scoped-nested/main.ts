// @dynamic
// A scoped package whose implementation requires a RELATIVE submodule with
// no extension (Node resolution: tables → tables.js).
import { convert } from "@acme/units";

const km: string = convert(5, "kilometers");
console.log(km);
const raw: string = convert(3, "furlongs");
console.log(raw);
