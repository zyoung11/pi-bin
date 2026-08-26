// Contract-sidecar attestation fixture: pins the OTHER value of every
// shape flag (tuple-returning init/update, a subscriptions export), the
// absent forms of the optional conventions (no unbound consts, no channel
// consts — the sidecar states empty lists and nulls), the default sidecar
// path (<out>.contract.json), and the computed determinism attestation:
// Date.now() below reaches the live clock, so `deterministic` MUST come
// out false while the program still compiles and runs.

export interface Model {
  stamp: number;
  label: string;
}

export type Msg = { kind: "tick" } | { kind: "label_set"; value: string };

export function init(): [Model, string] {
  return [{ stamp: Date.now(), label: "start" }, "boot-cmd"];
}

export function update(m: Model, msg: Msg): [Model, string] {
  switch (msg.kind) {
    case "label_set":
      return [{ stamp: m.stamp, label: msg.value }, "noop"];
    default:
      return [{ stamp: m.stamp + 1, label: m.label }, "noop"];
  }
}

export function subscriptions(m: Model): string {
  return m.label;
}

let state: Model = init()[0];

export function boot(): number {
  const pair = update(state, { kind: "tick" });
  state = pair[0];
  return state.stamp;
}

console.log("attest ready");
