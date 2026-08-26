// @dynamic
// The smol-toml wall, reduced: a DUAL package (exports with distinct
// "import"/"require" condition targets — tomlish is smol-toml's exact
// shape) reached through every call form the vercel CLI's esbuild dist
// uses, including a __require helper that lives in a SHARED chunk. Node
// picks the condition set from the CALL FORM, never the importer's
// format, and resolves helper requires from the chunk that DEFINED the
// helper — so the import forms must see the ESM entry, both require
// forms the (single, shared) CJS instance, differentially byte-exact.
import { probe } from "chunky";

async function run(): Promise<void> {
  const report: string = await probe();
  console.log(report);
}

void run();
