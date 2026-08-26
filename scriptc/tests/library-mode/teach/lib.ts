// K11 fixture: the structured trap-teaching channel.
//
// `wrap` carries a bytes parameter, so its wrapper owns the inbound-length
// host-contract trap (code SC4012): the profile above supplies the teaching
// and remediation the compiler assembles around the code and the trapping
// symbol — the probe drives the trap with an impossible length and parses
// the exact byte layout back out of the sink.
//
// `teach` and `teachStr` throw facade-authored STRUCTURED teachings (an
// Error message and a bare thrown string, each beginning with the 0x01
// marker): the ratified verbatim rule says these ride the escaped-exception
// channel byte-for-byte — never an "Uncaught " prefix, never an added
// newline. The embedded code is embedder-prefixed (NS space), exactly the
// code-space ruling.
//
// `boomRuntime` and `failRuntime` trap and throw the ordinary way — the
// RUNTIME-detected family: the funnel assembles their sink messages into
// the structured form unconditionally. This profile declares a teaching
// and remediation for the range code (SC4014), so `boomRuntime`'s message
// overlays both; the escaped-exception code (SC4013) declares neither, so
// `failRuntime`'s message keeps the baseline "Uncaught ..." line as its
// text and carries NO remediation field. The probe also pins that the
// human text still LEADS the buffer with a printable byte — the plain-text
// degradation the 0x01 marker's unambiguity rests on.
export function wrap(b: Uint8Array): number {
  return b.length;
}

export function teach(): number {
  throw new Error(
    "\u0001tag 99 does not name a bare message arm of this core\u001fNS1207\u001fkv_dispatch\u001frebuild the app so the compiled core and the host shim come from one build",
  );
}

export function teachStr(): number {
  throw "\u0001string-thrown teaching\u001fNS0002\u001fkv_teach_str";
}

export function boomRuntime(i: number): number {
  const xs = [1, 2, 3];
  return xs[i]!;
}

export function failRuntime(): number {
  throw new Error("kaput");
}

console.log("teach ready");
