// `export * from`: every base export re-exported wholesale; the specifier
// is a module edge (base evaluates before this file — but it already did,
// each module once).
console.log("star init");
export * from "./base.ts";
