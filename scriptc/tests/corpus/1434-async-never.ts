// `never` in return position: a throw-only lambda types as `() => never`
// (sync) or `() => Promise<never>` (async) — both map like their void
// twins, so throw-only helpers are ordinary values. The async form is the
// Real-CLI pattern: an always-rejecting async arrow with a .catch consumer.
const die = (): never => {
  throw new Error("sync boom");
};
try {
  die();
} catch (e) {
  console.log(e instanceof Error ? e.message : String(e));
}

const dieSoon = async () => {
  throw new Error("async boom");
};
dieSoon().catch((e) => {
  console.log(`caught ${e}`);
});

async function fetchOrThrow(which: boolean): Promise<string> {
  if (which) return "data";
  throw new Error("no data");
}
async function main(): Promise<void> {
  console.log(await fetchOrThrow(true));
  try {
    await dieSoon();
    console.log("unreachable");
  } catch (e) {
    console.log(e instanceof Error ? `awaited: ${e.message}` : "?");
  }
  try {
    await fetchOrThrow(false);
  } catch (e) {
    console.log(`second: ${e}`);
  }
}
main();
