// The network-failure rejection's CAUSE, Node's shape: a refused
// connection rejects with TypeError "fetch failed" whose cause is a plain
// Error carrying `connect ECONNREFUSED host:port`, code ECONNREFUSED, and
// syscall connect — the fields AI-SDK-style wrappers classify retryable
// network errors by (provider-utils' handleFetchError reads exactly
// these; the real-CLI retry path is the motivating consumer). The probe
// lives in package code — where those consumers live. argv[3] is the
// harness's just-released local port.
import { probeRefused } from "fetchcause";

async function main(): Promise<void> {
  await probeRefused(process.argv[3]!);
}

main().catch(() => {});
