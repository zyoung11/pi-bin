// Element access and .length on island values whose .d.ts type is an
// ARRAY (the SC9001 ICE family): the call result stays an engine handle
// (arrays never exit eagerly), so v[0] and v.length must ride engine ops
// with validated exits at the declared element type — not static
// arrayGet/arrIntrinsic on a jsval.
import { parts, pair, issueOf, nums } from "arrpack";

// Direct expression forms — no binding, the receiver is the raw handle.
console.log(parts("a,b,c")[0]);
console.log(parts("a,b,c").length);
console.log(nums()[2] + 1);

// Member reads declared as arrays stay handles too; index + length on the
// property-access chain.
const issue = issueOf("boom");
console.log(issue.path.length);
const p0 = issue.path[0];
console.log(typeof p0 === "string" ? p0 : "not-a-string");
const p1 = issue.path[1];
console.log(typeof p1 === "number" ? p1 + 1 : -1);

// Tuple-typed .d.ts returns are the same family (the anonymous tuple type
// has no npm symbol, so the checker maps it structurally).
console.log(pair()[0]);
console.log(pair()[1]);

// A dynamic (non-literal) index over the handle.
let i = 0;
i += 2;
console.log(parts("x,y,z")[i]);
