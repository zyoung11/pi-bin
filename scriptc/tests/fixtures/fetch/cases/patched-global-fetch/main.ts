// The polyfill/interceptor pattern end-to-end: an island package's module
// init replaces globalThis.fetch BEFORE later code runs (module order —
// the dotenv/config shape), and USER-code fetch reads the LIVE global at
// call time, so both the user request and an embedded package's request
// route through the wrapper, which rewrites a fake origin to the local
// server. Byte-exact vs Node: tap logs, response body, and the wrapper
// surviving for a second call.
import { tappedFetchName } from "fetchtap";

async function main(): Promise<void> {
  console.log(`wrapper installed: ${tappedFetchName()}`);
  const res = await fetch("https://gateway.invalid/text", {
    signal: AbortSignal.timeout(5000),
  });
  const body = await res.text();
  console.log(`user-fetch ${res.status} ${body}`);
  const res2 = await fetch("https://gateway.invalid/json");
  const json = (await res2.json()) as { n: number; s: string };
  console.log(`user-fetch-2 ${res2.status} n=${json.n} s=${json.s}`);
}

main().catch((e) => {
  console.log(`FATAL ${e instanceof Error ? e.message : String(e)}`);
});
