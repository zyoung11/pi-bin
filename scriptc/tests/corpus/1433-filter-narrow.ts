// Narrowing filters: a TS-inferred type predicate re-tags the retained
// elements to the narrowed single arm, and filter(Boolean) keeps the
// truthy elements (its checker type drops null/undefined arms). The
// non-narrowing filter path is untouched.
const xs: (string | undefined)[] = ["ship", undefined, "code", undefined, "now"];
const ys = xs.filter((x) => x !== undefined);
console.log(ys.length);
console.log(ys.join(","));
console.log(ys.map((s) => s.length).join(","));

const ns: (number | null)[] = [3, null, 1, 4, null, 5];
const kept = ns.filter((n) => n !== null);
console.log(kept.join("+"));

// filter(Boolean): truthy strings survive; "" goes with undefined.
const raw: string[] = ["alpha", "", "beta", "", "gamma"];
console.log(raw.filter(Boolean).join("-"));
// On a union-element array the checker keeps the union (TS has no special
// filter(Boolean) overload), so the result element stays the union — the
// truthy test still drops undefined and "" at runtime.
const maybe: (string | undefined)[] = ["a", undefined, "", "b"];
console.log(maybe.filter(Boolean).length);
const nums: number[] = [0, 1, 2, 0, 3];
console.log(nums.filter(Boolean).join(""));

// The predicate desugar composes with the ordinary HOF pipeline.
const pipeline = xs.filter((x) => x !== undefined).map((s) => `<${s}>`);
console.log(pipeline.join(""));

// Plain boolean callbacks keep the generic filter path (same element type).
const longOnes = ys.filter((s) => s.length > 3);
console.log(longOnes.join(","));

// Annotating the RESULT with the receiver's own element type opts out of
// the narrowing: the elements stay the wide union (corpus 542's pattern).
const wide: (string | undefined)[] = xs.filter((x) => x !== undefined);
console.log(wide.length);
