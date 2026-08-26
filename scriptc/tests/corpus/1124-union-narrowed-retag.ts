// A checker-narrowed union flowing into a SMALLER union: control-flow
// narrowing proves arms away at the site, and the widening compiles with
// trap cases for the stranded arms (divergence 38's stance extended past
// unit arms) — sound narrowing never reaches them, so behavior is
// Node-exact end to end.

interface Wrapped {
  data: string;
  id?: string;
}
type Gen = string | number | Wrapped;

function norm(result: Gen): { data: string | number; id?: string } {
  if (typeof result === "string" || typeof result === "number") {
    // result is string | number here; the record arm is stranded and traps
    // (never reached — the checker proved it away).
    return { data: result };
  }
  return { data: result.data, ...(result.id ? { id: result.id } : {}) };
}

function show(x: { data: string | number; id?: string }): string {
  return `${x.data}:${x.id ?? "-"}`;
}
console.log(show(norm("text")));
console.log(show(norm(42)));
console.log(show(norm({ data: "wrapped", id: "i1" })));
console.log(show(norm({ data: "bare" })));

// The narrowed value also passes through calls and locals.
function pick(v: string | undefined | Wrapped): string | undefined {
  if (typeof v === "object") return v.data;
  return v;
}
console.log(pick("plain") ?? "-", pick(undefined) ?? "-", pick({ data: "obj" }) ?? "-");
