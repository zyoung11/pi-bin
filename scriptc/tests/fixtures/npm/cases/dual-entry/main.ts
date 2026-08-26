// @dynamic
// Dual-published package: the ESM ("import" condition) entry wins, exactly
// like Node resolving an import statement.
import { flavor } from "dual";

const f: string = flavor;
console.log(f);
