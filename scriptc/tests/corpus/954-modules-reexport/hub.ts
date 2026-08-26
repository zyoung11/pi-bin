// Re-export forms: a bare export list of imported bindings (the mdns
// pattern — `import { x } ...; export { x };`) and a named re-export with
// a specifier (aliased). Both are pure alias plumbing: importers resolve
// through to base.ts's bindings, mutations included.
import { counter, inc } from "./base.ts";

console.log("hub init", counter);

export { counter, inc };
export { greet as salute } from "./base.ts";
