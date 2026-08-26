// Two unmasked-by-validation fixes: `x!` narrows union VALUES like any
// checker-narrowed read (the Map get-or-init push idiom), and
// String.fromCharCode over a SPREAD typed array/Buffer (the magic-number
// ASCII probe).

interface Entry { creator: string; id: string }
function groupByCreator(models: Entry[]): Map<string, Entry[]> {
  const groups = new Map<string, Entry[]>();
  for (const m of models) {
    if (!groups.has(m.creator)) groups.set(m.creator, []);
    groups.get(m.creator)!.push(m);
  }
  return groups;
}
const g = groupByCreator([
  { creator: "vercel", id: "v1" },
  { creator: "openai", id: "o1" },
  { creator: "vercel", id: "v2" },
]);
g.forEach((entries, creator) => {
  console.log(creator, entries.length, entries.map((e) => e.id).join("+"));
});

// `!` on other union-typed reads: field values and scalar payloads.
const maybe = new Map<string, number>();
maybe.set("k", 41);
console.log(maybe.get("k")! + 1);
const opt: { v?: string } = { v: "here" };
console.log(opt.v!.length);

// fromCharCode over sliced bytes — the asciiAt/hasIsoImageBrand pattern.
function asciiAt(data: Uint8Array, offset: number, length: number): string {
  if (data.length < offset + length) return "";
  return String.fromCharCode(...data.slice(offset, offset + length));
}
const magic = new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112, 97, 118, 105, 102]);
console.log(asciiAt(magic, 4, 4));
console.log(asciiAt(magic, 8, 4));
console.log(asciiAt(magic, 8, 40));
console.log(String.fromCharCode(...Buffer.from("buffer too")));
console.log(String.fromCharCode(...new Uint32Array([72, 0x10348, 66])));
// The packed-argument and array-spread forms keep working.
console.log(String.fromCharCode(72, 105, 0xd83d, 0xde00));
const codes = [104, 101, 121];
console.log(String.fromCharCode(...codes));
