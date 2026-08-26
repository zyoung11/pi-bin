// Contextually-typed lambdas adopt a slot's UNION return as their ABI —
// sync and ASYNC (through the promise) — with each return coercing per
// site: exact arms wrap, records width-coerce into their record arm (the
// runJobs generate-callback pattern: an inferred { data, id } literal
// against string | GeneratedOutput), and mixed-return bodies coerce each
// return on its own.

interface GeneratedOutput {
  data: Uint8Array | string;
  id?: string;
}
type GenerateResult = string | GeneratedOutput;

function describe(r: GenerateResult): string {
  if (typeof r === "string") return "str:" + r;
  const id = r.id;
  const data = r.data;
  const dataDesc = typeof data === "string" ? "s(" + data + ")" : "b(" + data.length + ")";
  return "out:" + dataDesc + "/" + (id === undefined ? "none" : id);
}

function runSync(generate: (modelId: string) => GenerateResult): string {
  return describe(generate("gpt"));
}

// Arm-exact returns (string), and record returns that width-coerce.
console.log(runSync((m) => "plain-" + m));
console.log(runSync((m) => ({ data: "d-" + m, id: m })));
console.log(runSync((m) => ({ data: new Uint8Array([1, 2, 3]), id: undefined as string | undefined })));

// Mixed returns in one body: each return site coerces on its own.
console.log(
  runSync((m) => {
    if (m.length > 2) return "long-" + m;
    return { data: "short", id: "s" };
  })
);

// The async twin — runJobs' actual shape.
async function runJobs(generate: (modelId: string) => Promise<GenerateResult>): Promise<string> {
  const r = await generate("model-x");
  return describe(r);
}

async function main(): Promise<void> {
  console.log(await runJobs(async (modelId) => {
    return {
      data: new Uint8Array([7, 7, 7]),
      id: "id-" + modelId,
    };
  }));
  console.log(await runJobs(async (modelId) => "async-str-" + modelId));
  console.log(await runJobs(async (modelId) => {
    if (modelId.length > 3) return { data: "long", id: undefined as string | undefined };
    return "short";
  }));
}
main();
