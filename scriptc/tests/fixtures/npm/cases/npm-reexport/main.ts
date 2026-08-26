// @dynamic
// Named re-exports from npm packages (ESM and CJS exporters), consumed by
// name and as the facade's default. Values exit at the typed boundaries the
// exporters' .d.ts declare, exactly like direct imports.
import { greet, punctuation, shout, plus } from "./facade.ts";
import gdef from "./default-facade.ts";

const p: string = punctuation;
console.log(greet("world"), p);
console.log(shout("world"));
console.log(plus(20, 22) as number);
console.log(gdef("again"));
