// Record width coercion lifts FIELDS now: a target field typed as a union
// accepts a same-named source field holding an arm (`text: string` into
// `text?: string`) or a re-taggable union. The coercion COPIES the record
// (SEMANTICS.md); everything below is read-after-widen, which is
// Node-exact. Literals are written with alphabetical fields so stringify's
// canonical order matches Node's insertion order.

type Loaded = { images: string[]; text: string };
type Prompt = { images: string[]; text?: string };

function mkLoaded(i: number): Loaded {
  return { images: [`img${i}`], text: `t${i}` };
}

// Non-union slot: a typed local into an optional-field shape.
const l = mkLoaded(1);
const p: Prompt = l;
console.log(JSON.stringify(p));

// Union-arm slot: a record with a required field into a union whose
// record arm declares it optional (the CLI prompt pattern).
let imagePrompt: string | Prompt;
const withText: Loaded = mkLoaded(2);
imagePrompt = withText;
console.log(JSON.stringify(imagePrompt));
imagePrompt = "plain";
console.log(JSON.stringify(imagePrompt));

// A MISSING optional-flavored field completes to its undefined arm — the
// bare `{ images }` pattern.
function pickPrompt(hasText: boolean): string | Prompt {
  if (hasText) {
    return mkLoaded(9);
  }
  const bare: { images: string[] } = { images: ["i"] };
  return bare;
}
console.log(JSON.stringify(pickPrompt(true)), JSON.stringify(pickPrompt(false)));

// The literal-ternary form (the CLI's imagePrompt shape): each arm lowers
// against the union, one lifting `text`, the other completing it.
function ternaryPrompt(text: string | undefined, images: string[]): string | Prompt {
  let p: string | Prompt;
  p = text ? { images, text } : { images };
  return p;
}
console.log(JSON.stringify(ternaryPrompt("cap", ["x"])), JSON.stringify(ternaryPrompt(undefined, ["y"])));

// Field-level union RE-TAG: a string | undefined source field into a
// string | null | undefined target field.
type Src = { n: number; v: string | undefined };
type Dst = { n: number; v?: string | null };
function mkSrc(v: string | undefined): Src {
  return { n: 1, v };
}
const d1: Dst = mkSrc("x");
const d2: Dst = mkSrc(undefined);
console.log(JSON.stringify(d1), JSON.stringify(d2));

// Record ARRAYS lift per element.
const rows: Loaded[] = [mkLoaded(3), mkLoaded(4)];
const prompts: Prompt[] = rows;
console.log(JSON.stringify(prompts));
for (const row of prompts) {
  console.log(row.text ?? "none");
}

// The classic subset copy still works alongside lifting fields — reads
// only here: the copy's shape is narrower than Node's aliased original
// (SEMANTICS.md divergence), so the fields are read individually.
type Full = { id: string; n: number; note: string };
type Pick2 = { id: string; n?: number };
function mkFull(): Full {
  return { id: "a1", n: 7, note: "keep" };
}
const picked: Pick2 = mkFull();
console.log(picked.id, picked.n ?? -1);
