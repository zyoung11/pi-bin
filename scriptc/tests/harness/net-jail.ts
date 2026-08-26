/* The loopback network jail the e2e suites give their children: env
 * proxies at a REFUSED loopback port with no_proxy carved out for
 * 127.0.0.1, so the local mock stays reachable and any URL that escapes
 * toward the real internet fails fast at connect time — without ever
 * leaving the machine.
 *
 * What respects it: Node's global fetch (undici) under NODE_USE_ENV_PROXY=1,
 * and scriptc's own fetch implements the same opt-in with relay parity
 * (fetch.test.ts's proxy-optin case) — so the jail is lane-symmetric.
 * Verified for the vercel CLI by capturing `CONNECT api.vercel.com:443`
 * arriving at a loopback stand-in proxy (vercel-e2e.test.ts's beforeAll).
 *
 * What does NOT respect it: raw node:http(s) clients never consult proxy
 * env (the vercel update-check worker's https.get is the live example —
 * neutralized there with NO_UPDATE_NOTIFIER=1). A suite jailing a child
 * with such a path must disable it separately or accept the escape. */
import { createServer } from "node:http";

/** A URL on a loopback port that was just bound and released: connecting
 * to it refuses. */
export async function refusedLoopbackUrl(): Promise<string> {
  const probe = createServer(() => {});
  await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const addr = probe.address();
  if (addr === null || typeof addr !== "object") throw new Error("no probe address");
  const url = `http://127.0.0.1:${addr.port}`;
  await new Promise<void>((resolve) => probe.close(() => resolve()));
  return url;
}

/** The jail's env block, spread into a child's environment. */
export function jailEnv(refusedUrl: string): Record<string, string> {
  return {
    NODE_USE_ENV_PROXY: "1",
    http_proxy: refusedUrl,
    https_proxy: refusedUrl,
    HTTP_PROXY: refusedUrl,
    HTTPS_PROXY: refusedUrl,
    no_proxy: "127.0.0.1",
    NO_PROXY: "127.0.0.1",
  };
}
