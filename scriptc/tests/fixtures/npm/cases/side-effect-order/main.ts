// Module-evaluation ORDER across the whole graph, island packages
// included: Node runs each imported module's top-level at the import's
// position (depth-first, each module once). order-a comes before the user
// module mid.ts, whose own import of order-c runs before ITS body; order-b
// comes after; a re-import of an already-evaluated package is a cache
// lookup, not a re-evaluation. The dotenv/config pattern — a polyfill
// package imported first must have run before later modules' top-level
// code. Each init logs, so stdout IS the evaluation order:
//   order-a init / order-c init / mid init / order-b init / main last.
import "order-a";
import "./mid.ts";
import "order-b";
import "order-c"; // already evaluated by mid.ts: no output, no re-run

console.log("main last");
