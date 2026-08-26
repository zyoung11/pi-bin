// Computed property keys on object literals that FOLD at compile time:
// a compile-time-known string key is just a spelled key, so the literal
// keeps its static record shape — const string-literal identifiers (the
// { [MARKER]: v } idiom), quoted keys in brackets, substitution-less
// templates, templates of literals, parenthesized/as-const forms, and
// the folded key landing in a DECLARED optional field. Runtime-valued
// keys on typed records stay fenced (checked-dynamic JS routes them to
// the runtime-keyed dyn literal instead — not this program's world).
const MARKER = "app_marker";
const PREFIX = "x" as const;
const o1 = { [MARKER]: 1, plain: 2 };
console.log(o1[MARKER], o1.plain, JSON.stringify(o1));
const o2 = { ["quoted key"]: "a", [`tmpl`]: "b", [`${PREFIX}-id`]: "c", [`${MARKER}${PREFIX}`]: "d" };
console.log(JSON.stringify(o2));
console.log(o2["quoted key"], o2.tmpl, o2["x-id"], o2.app_markerx);
const o4: Record<string, number> = { [("paren")]: 5, ["k" as const]: 6 };
console.log(JSON.stringify(o4));
interface Opts { "a-b"?: number; c?: number }
const o5: Opts = { ["a-b"]: 1 };
console.log(JSON.stringify(o5), o5["a-b"] ?? -1, o5.c ?? -1);
// The folded key participates in ordinary record machinery: it
// round-trips through JSON like any spelled field.
const back = JSON.parse(JSON.stringify(o1)) as { app_marker: number; plain: number };
console.log(back.app_marker + back.plain);
