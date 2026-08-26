// tsgo tolerates a leading comment in an imported JSON module; strict
// JSON.parse (and Node's own JSON-module import) rejects it — the SC0003
// gate at the import, never an uncaught parse throw (invariant signature 05).
import a from "./a.json" with { type: "json" };
console.log(a.key);
