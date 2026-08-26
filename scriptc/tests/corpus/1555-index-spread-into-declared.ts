// Index-signature spreads into a DECLARED shape — the defaults-merge idiom
// over runtime-keyed sources (the portless appOverride pattern): sources
// evaluate once each, contributors apply in order (last write wins), keys
// matching declared fields fill them, absent keys leave the optional
// fields undefined.

interface AppConfig {
  name?: string;
  script?: string;
  appPort?: number;
  proxy?: boolean;
}

function pick(config: AppConfig | null): { [k: string]: string | number | boolean | undefined } {
  return Object.fromEntries(Object.entries(config ?? {}).filter(([, v]) => v !== undefined));
}

let evals = 0;
function counted(config: AppConfig | null): { [k: string]: string | number | boolean | undefined } {
  evals++;
  return pick(config);
}

const rootOverride: AppConfig | null = { name: "root", appPort: 3000, proxy: false };
const pkgConfig: AppConfig | null = { script: "dev", appPort: 4000 };

const merged: AppConfig = {
  ...counted(rootOverride),
  ...counted(pkgConfig),
};
// Sources evaluated exactly once each (JS's evaluate-once for spreads).
console.log("evals:", evals);
console.log(`${merged.name} ${merged.script} ${merged.appPort} ${merged.proxy}`);

// Later contributor wins for colliding keys.
console.log("appPort:", merged.appPort === 4000);

// Null-ish sources contribute nothing; unset optionals read undefined.
const empty: AppConfig = { ...pick(null), ...pick(null) };
console.log(empty.name === undefined, empty.proxy === undefined);

// A single spread works too, and false/0/"" values survive (only the
// filter's explicit undefined test drops entries, not falsiness).
const single: AppConfig = { ...pick({ proxy: false, appPort: 0, name: "" }) };
console.log(`${single.proxy} ${single.appPort}`, single.name === "");

// Presence via the undefined arm follows the keys at runtime.
function fields(c: AppConfig): string {
  const out: string[] = [];
  if (c.name !== undefined) out.push("name");
  if (c.script !== undefined) out.push("script");
  if (c.appPort !== undefined) out.push("appPort");
  if (c.proxy !== undefined) out.push("proxy");
  return out.join(",");
}
console.log(fields(merged));
console.log(fields(empty));
console.log("done");
