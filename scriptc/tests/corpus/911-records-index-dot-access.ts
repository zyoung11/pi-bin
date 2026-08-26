// Dot access to UNDECLARED index-signature keys: the overflow path in dot
// spelling — reads and writes hit exactly the same recordKeyGet/Set path
// as brackets, so the two spellings are interchangeable (the real-CLI
// buildProviderOptions pattern: nested Record writes through dot chains).

// Nested Record<string, Record<string, string>>: dot writes at both levels,
// reads back through both spellings.
const providerOptions: Record<string, Record<string, string>> = {};
providerOptions.openai = {};
providerOptions.openai.quality = "high";
providerOptions.openai.style = "vivid";
console.log(providerOptions.openai.quality, providerOptions["openai"]["style"]);

// Dot and bracket writes interleave into ONE overflow map; insertion order
// and last-write-wins are shared.
const bag: Record<string, string> = {};
bag.alpha = "a";
bag["beta"] = "b";
bag.alpha = "a2";
console.log(bag["alpha"], bag.beta);

// Compound dot assignment on numeric index values.
const counts: Record<string, number> = {};
counts.x = 1;
counts.x += 41;
counts.x *= 2;
console.log(counts.x);

// `unknown`-valued signatures: typed values convert into the dyn slot on
// dot writes (numbers, strings, booleans, undefined/null, arrays, records),
// and read back through checked casts — either spelling.
const scratch: Record<string, unknown> = {};
scratch.n = 5;
scratch.s = "str";
scratch.b = true;
scratch.u = undefined;
scratch.nl = null;
scratch.list = [1, 2, 3];
scratch.meta = { level: 3, name: "deep" };
console.log(scratch.n as number, scratch["s"] as string, scratch.b as boolean);
console.log((scratch.u as string | undefined) === undefined, scratch.nl === null);
console.log((scratch.list as number[]).length, (scratch.meta as { level: number; name: string }).name);

// Hybrid shapes (declared fields + signature): dot access to a DECLARED
// field stays the struct read; an undeclared name rides the overflow.
interface Pricing {
  input?: string;
  [key: string]: unknown;
}
const p: Pricing = { input: "1.50" };
p.web_search = "0.01";
console.log(p.input !== undefined ? p.input : "none", p.web_search as string);

// Aliasing: dot writes mutate the one record all references see.
const alias = counts;
alias.y = 7;
console.log(counts.y, counts === alias);

// The deep-copy stance on unknown slots: a RECORD stored under `unknown`
// converts by DEEP COPY (SEMANTICS.md) — reads through the slot see the
// value as stored, and the copy round-trips intact even after the source
// evolves. (Mutations of the source after the store are invisible to the
// stored copy — the documented divergence; not asserted here, where Node
// is the oracle.)
const src = { level: 1, tag: "orig" };
scratch.snapshot = src;
const snap = scratch.snapshot as { level: number; tag: string };
console.log(snap.level, snap.tag);
