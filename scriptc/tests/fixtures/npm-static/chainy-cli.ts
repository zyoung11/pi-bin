// Chained getter/setter calls typed by the package's own .d.ts overloads:
// the auto opt-in drops chainy back to the island (its INFERRED surface
// types name() as `string | Chainy`, breaking these chains) — the program
// must stay analyzable either way.
import { Chainy } from "chainy";

const c = new Chainy();
c.name("emulate").tag("cli");
console.log(c.render());
console.log(c.name());
