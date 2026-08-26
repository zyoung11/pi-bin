// `1e999` as a type crosses the API as +Inf, which tsgo cannot JSON-marshal
// (upstream signature 03): the collection-side panic fence defers the
// SC0004 under the declaration like any collection fence.
type A = 1e999;
export function f(): A { throw new Error("x"); }
export const m = f();
