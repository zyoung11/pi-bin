// Assertion-function narrowing over JSON.parse results (the config-loader
// shape): after `asserts config is T` runs, the unknown value flows into
// T-typed slots through the AUTOMATIC validated extraction — dynCheck, the
// checked-cast machinery, trust-but-verify. A truthful assertion never
// trips the check; the extraction builds the typed record (missing
// optional keys become the undefined arms, exactly like `as T`).
type AppConfig = { script?: string; appPort?: number };
type Config = {
  name?: string;
  port?: number;
  proxy?: boolean;
  apps?: { [key: string]: AppConfig };
};

class ConfigValidationError extends Error {}

function validateConfig(config: unknown, path: string): asserts config is Config {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    throw new ConfigValidationError(`${path} must be a JSON object.`);
  }
  const obj = config as { [key: string]: unknown };
  if (obj.name !== undefined && typeof obj.name !== "string") {
    throw new ConfigValidationError(`"name" in ${path} must be a string.`);
  }
  if (obj.port !== undefined && typeof obj.port !== "number") {
    throw new ConfigValidationError(`"port" in ${path} must be a number.`);
  }
}

function load(raw: string): { config: Config; dir: string } | null {
  const parsed = JSON.parse(raw);
  try {
    validateConfig(parsed, "portless.json");
  } catch (e) {
    console.log("rejected:", e instanceof Error ? e.message : "?");
    return null;
  }
  return { config: parsed, dir: "/tmp" };
}

const full = load('{"name":"web","port":3000,"proxy":true,"apps":{"a":{"script":"dev","appPort":5173}}}');
if (full) {
  console.log(full.config.name ?? "anon", full.config.port ?? 0, full.config.proxy ?? false);
  const app = full.config.apps?.a;
  console.log("app:", app?.script ?? "none", app?.appPort ?? 0);
}

const minimal = load("{}");
if (minimal) {
  console.log(minimal.config.name ?? "anon", minimal.config.port ?? 0, minimal.config.proxy ?? false);
  console.log("apps:", minimal.config.apps === undefined);
}

const bad = load("[1,2]");
console.log("bad is null:", bad === null);
