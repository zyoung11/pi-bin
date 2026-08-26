// Named re-exports from npm packages: import-plus-export plumbing — the
// island load runs at these statements' positions in this module's init,
// and consumer reads resolve through the alias chain to the same storage
// a direct import would bind.
export { greet, punctuation } from "greeter";
export { default as shout } from "greeter";
export { add as plus } from "adder";
