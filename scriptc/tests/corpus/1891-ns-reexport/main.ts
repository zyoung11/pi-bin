// Namespace RE-exports: `import { sh }` lands on the namespace binding,
// and the nested `agg.sh.helper` chain resolves member-by-member — live
// mutable members included.
import { sh } from "./agg.ts";
import * as agg from "./agg.ts";

console.log(sh.helper() + agg.h2());
console.log(agg.sh.live);
agg.sh.bump();
console.log(sh.live);
import { Drink } from "./drink.ts";
const cup: Drink = Drink.TEA;
console.log(cup, Drink.COFFEE);
