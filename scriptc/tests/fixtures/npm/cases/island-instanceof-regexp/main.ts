// The two boundary quick wins from the provenance pilot: `instanceof`
// against a package-exported class (the safeParse-style narrowing — the
// spec operator runs in the engine), and RegExp values crossing INTO the
// island (the z.string().regex(/x/) shape — a fresh engine RegExp built
// from source+flags).
import { Boom, make, grep } from "arrpack";

// instanceof: island LHS, island class RHS — both outcomes.
const v = make("boom");
console.log(v instanceof Boom ? "boom" : "plain");
console.log(v instanceof Boom ? v.msg : "-");
const w = make("other");
console.log(w instanceof Boom ? "boom" : "plain");

// RegExp arguments: literals and regex-typed bindings, flags included.
console.log(grep(/^a/, ["ax", "bx", "aY"]).join(","));
console.log(grep(/y$/i, ["aY", "by", "cz"]).join(","));
const re = /\d{2}/;
console.log(grep(re, ["a1", "b22", "c333"]).join(","));
