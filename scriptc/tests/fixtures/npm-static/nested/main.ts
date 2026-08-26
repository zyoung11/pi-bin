// The auto probe's resolution ANCHOR: shouty is installed only in
// inner/'s own node_modules — visible from the importing file's walk-up,
// invisible from this entry's (the pnpm-monorepo shape: vercel's CLI deps
// live in packages/cli/node_modules while the driver entry sits outside).
// auto must probe the runtime JS from the file that IMPORTS the package,
// or eligibility answers "no runtime JS entry resolves" for a perfectly
// ordinary install.
import { run } from "./inner/app.ts";

console.log(run());
