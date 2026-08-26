// The `string & {}` special-intersection index key: mapped types use it to
// keep a literal-key union wide (`Record<(string & {}) | "left" | ..., T>`
// — TypeScript's suggestion-preserving idiom). The key domain is exactly
// `string`, so the shape is the ordinary hybrid: declared literal-key
// members keep struct slots, everything else rides the overflow.
type Alignment = (string & {}) | "left" | "center" | "right";
type Alignments = Record<Alignment, string>;

const a: Alignments = {
  left: "align-left",
  center: "align-center",
  right: "align-right",
  other: "align-other",
};

console.log(a.left, a.center.length, a.right);
console.log(a.other, a["other"].length);
a.custom = "align-custom";
console.log(a["custom"]);

// Enumeration on a SOURCE-DECLARED hybrid (mapped types take the checker's
// member order, and a structurally-equal shape interned earlier donates its
// order — divergence 37; a structurally distinct longhand interface keeps
// source order).
interface Toolbar {
  [k: string]: string;
  top: string;
  middle: string;
  bottom: string;
}
const t: Toolbar = {
  top: "tool-top",
  middle: "tool-middle",
  bottom: "tool-bottom",
  extra: "tool-extra",
};
console.log(JSON.stringify(t));
console.log(Object.keys(t).join(","));
