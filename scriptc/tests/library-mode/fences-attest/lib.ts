// The ask-5 §4 invariant fixture: the worked-example determinism profile
// (translated into this release's real manifest ids, extended to fence
// EVERY ambient family the attestation demotes on — the Date compositions,
// the process global's ambient slice, and perf_hooks included) over a
// program that COMPILES under it. Every fence is present and unreached,
// and the sidecar's computed attestation must come out `deterministic:
// true` — with fences covering the ambient-nondeterminism surfaces,
// determinism holds by construction for whatever compiles, so a program
// that compiles under full fences yet attests false is a bug in one of
// the two scans, never ambiguity.

export interface Model {
  total: number;
  label: string;
}

export type Msg = { kind: "add"; value: number } | { kind: "label_set"; value: string };

export function init(): Model {
  return { total: 0, label: "start" };
}

export function update(m: Model, msg: Msg): Model {
  switch (msg.kind) {
    case "add":
      return { total: m.total + msg.value, label: m.label };
    default:
      return { total: m.total, label: msg.value };
  }
}

let state: Model = init();

export function boot(delta: number): number {
  state = update(state, { kind: "add", value: Math.floor(delta) });
  return state.total;
}

console.log("fences-attest ready");
