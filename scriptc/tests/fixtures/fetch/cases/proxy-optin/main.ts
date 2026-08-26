// Proxy-env parity, both halves. In the normal differential loop this
// runs with http_proxy/https_proxy POISONED (the harness points them at a
// refused port): Node's fetch ignores them without the opt-in, and the
// embedded runtime must too — the request goes DIRECT and succeeds. The
// dedicated opt-in test re-runs the same binary with NODE_USE_ENV_PROXY=1
// and http_proxy at a real local forward proxy: both lanes then route
// through it, byte-identically.
async function main(): Promise<void> {
  const res = await fetch(`${process.argv[2]}/text`);
  const body = await res.text();
  console.log(`via ${res.status} ${body}`);
}

main().catch((e) => {
  console.log(`FATAL ${e instanceof Error ? e.message : String(e)}`);
});
