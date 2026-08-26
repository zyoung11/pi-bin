// Spread order and optional-union sources: explicit-keys-then-spread into a
// pure Record shape (the buildServiceEnv pattern — keyed last-write-wins,
// JS's own-key order preserved), and `{ ...DEFAULTS, ...overrides }` where
// overrides is `Partial<X> | undefined` (the optional-options merge idiom:
// the unit arm spreads nothing, present keys override, absent and
// explicitly-undefined keys keep the default — the completion stance).
function buildEnv(extra: Record<string, string>): Record<string, string> {
  const env: Record<string, string> = {
    PORT: "3000",
    HTTPS: "0",
    ...extra,
  };
  return env;
}
const e1 = buildEnv({ HTTPS: "1", CUSTOM: "x" });
console.log(e1["PORT"], e1["HTTPS"], e1["CUSTOM"], Object.keys(e1).join(","));
const e2 = buildEnv({});
console.log(Object.keys(e2).join(","));

interface Cfg {
  port: number;
  tld: string;
  lanMode: boolean;
  tlds: string[];
  lanIp: string | null;
}
const DEFAULTS: Cfg = { port: 80, tld: "localhost", lanMode: false, tlds: ["localhost"], lanIp: null };
function make(overrides?: Partial<Cfg>): Cfg {
  const cfg: Cfg = { ...DEFAULTS, ...overrides };
  return cfg;
}
const a = make();
console.log(a.port, a.tld, a.lanMode, a.tlds.join("|"), a.lanIp ?? "(null)");
const b = make({ port: 443, lanMode: true, lanIp: "192.168.0.7" });
console.log(b.port, b.tld, b.lanMode, b.tlds.join("|"), b.lanIp ?? "(null)");
const c = make({ tlds: ["local", "lan"], tld: "local" });
console.log(c.port, c.tld, c.lanMode, c.tlds.join("|"), c.lanIp ?? "(null)");
console.log(DEFAULTS.port, DEFAULTS.tld, DEFAULTS.tlds.length);

// A later explicit key wins over the optional spread (laterNames skip).
function makeWithPin(overrides?: Partial<Cfg>): Cfg {
  return { ...DEFAULTS, ...overrides, tld: "pinned" };
}
console.log(makeWithPin({ tld: "ignored", port: 8080 }).tld, makeWithPin({ tld: "ignored" }).port);
