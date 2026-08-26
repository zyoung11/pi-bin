// Contract-sidecar fixture with a statically-compiled npm module in the
// graph: the package's bytes join source_hash/build_id (the identity
// hashes cover the WHOLE compiled module graph — the suite proves a
// package-file edit flips both), while the contract's TYPE vocabulary
// stays authored program surface (the opted-in package's .d.ts is dropped
// by construction, so no npm declaration can name a wire type).
import { add } from "adderkit";

export interface Model {
  total: number;
}

export type Msg =
  | { kind: "bump"; by: number }
  | { kind: "reset" };

export function init(): Model {
  return { total: add(1, 2) };
}

export function update(m: Model, msg: Msg): Model {
  if (msg.kind === "bump") return { total: add(m.total, msg.by) };
  return { total: 0 };
}

export function apply(x: number): number {
  return add(x, 10);
}
