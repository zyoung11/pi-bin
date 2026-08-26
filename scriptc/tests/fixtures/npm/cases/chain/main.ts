// @dynamic
// A package importing another PACKAGE (ESM → CJS interop default), a
// relative ESM submodule, and a JSON module.
import { describe } from "chain";

const out: string = describe(2, 3);
console.log(out);
