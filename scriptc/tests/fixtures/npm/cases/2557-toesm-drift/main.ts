// gtdrift ships a __toESM whose text deviates beyond the structural
// recognizer: the opt-in (explicit or auto) must DEGRADE the package to
// the island with a note naming the construct — never a failed build, and
// never the silent alternative (the live helper chain's `var __create =
// Object.create;` would fence at module load while the report said
// "static").
import { drift } from "gtdrift";

console.log(drift());
