// Narrowing filters re-tag ONLY what the runtime test proved: an inferred
// single-arm predicate or filter(Boolean). Everything else stays fenced —
// multi-arm targets (the re-tag doesn't exist), hand-written predicates
// (unchecked assertions), and predicate VALUES (their annotation is
// written by definition).
const xs: (string | number | undefined)[] = ["a", 1, undefined];

// Multi-arm narrowing: string | number is not a single arm.
const defined = xs.filter((x) => x !== undefined);
console.log(defined.length);

// A hand-written predicate on an inline callback.
const ys: (string | undefined)[] = ["a", undefined];
const strings = ys.filter((x): x is string => typeof x === "string");
console.log(strings.length);

// A predicate VALUE (declared function with a written predicate).
function isString(x: string | undefined): x is string {
  return typeof x === "string";
}
const viaValue = ys.filter(isString);
console.log(viaValue.length);
