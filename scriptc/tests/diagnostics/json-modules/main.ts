/* JSON module fences: the DEFAULT import is the supported form (Node's own
 * ESM rule); named bindings fence at preflight. */
import { version } from "./pkg.json" with { type: "json" };

console.log(version);
