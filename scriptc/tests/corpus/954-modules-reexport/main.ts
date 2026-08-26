// Re-exports and export lists: bare lists, named re-exports with alias,
// and export *. Init order must be Node's (base, hub, star, main), each
// module once, and live bindings must survive the re-export hops.
import { counter, inc, salute } from "./hub.ts";
import { greet } from "./star.ts";

console.log("main start", counter);
inc();
inc();
// the importer observes base's mutations through hub's list re-export
console.log("after incs", counter);
console.log(salute("hub"), greet("star"));
