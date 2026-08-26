// Tagged templates, the static lowering: an interned per-site strings
// object (cooked spans, frozen identity per SITE — the same site
// evaluated twice hands the tag the SAME array; two sites never share,
// even with identical text) + an ordinary call of the tag. Values lower
// as ordinary arguments against the tag's declared parameters.
function tag(parts: TemplateStringsArray, a: number, b: string): string {
  return `${parts.length}|${parts.join("*")}|${a}|${b}`;
}
const n = 6 * 7;
console.log(tag`x${n}y${"z"}w`);
// Leading/trailing empty spans still occupy strings-array slots.
console.log(tag`${1}${"mid"}`);

// No-substitution form: one cooked span, zero values.
function solo(parts: TemplateStringsArray): string {
  return `${parts.length}:${parts[0]}`;
}
console.log(solo`only`);

// Cooked escapes: the spans carry the PROCESSED text (\t, \n, hex,
// unicode), exactly what Node's cooked array holds.
function codes(parts: TemplateStringsArray): string {
  const s = parts[0];
  let out = "";
  for (let i = 0; i < s.length; i++) out += `${s.charCodeAt(i)} `;
  return out.trim();
}
console.log(codes`\t\n\x41B`);

// Per-site identity: the memoizing-tag contract. One site evaluated in a
// loop is one array object; a textually identical SECOND site is another.
function ident(parts: TemplateStringsArray): TemplateStringsArray {
  return parts;
}
function site(): TemplateStringsArray {
  return ident`fixed`;
}
console.log(site() === site());
console.log(ident`one` === ident`one`);

// The strings object entering a UNION-typed slot wraps like any value.
function optional(parts: readonly string[] | undefined): number {
  return parts === undefined ? -1 : parts.length;
}
function viaUnion(parts: TemplateStringsArray, ...vals: number[]): number {
  return optional(parts) + vals.length;
}
console.log(viaUnion`a${0}b`);

// String.raw stays the raw-span splice (no array materializes).
console.log(String.raw`a\nb${n}`);
