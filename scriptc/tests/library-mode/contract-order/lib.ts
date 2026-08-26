// Ask-3 §2 conformance fixture: the three adversarial declaration-order
// shapes, plus the §3 union-composition rule.
//
//   1. Cargo's arms are declared anti-alphabetically AND their payload
//      records live in payloads.ts — the import list below is spelled
//      alphabetically (a third order, distinct from both the payloads'
//      declaration order and the arms' reference order), so any
//      import-order leakage into the table is caught.
//   2. Slot is an anti-alphabetical string-literal union with a member
//      shadowing a global name ("Infinity") — neither sorted nor
//      reverse-sorted, and never identifier-mangled.
//   3. CargoAlias references Cargo through a type alias: the table
//      derives from Cargo's declaration (name and arm order), the alias
//      introduces no entry and no reordering.
//   4. Msg is COMPOSED of other kind-tagged unions (the reducer pattern):
//      arm order is depth-first source order of the constituent
//      declarations — SpinMsg's arms in SpinMsg's own order, then the
//      inline "tap", then CoreMsg's — and CoreMsg's duplicate "wind"
//      (also in SpinMsg) drops: FIRST occurrence wins.
import type { Wisp, Yank, Zeta } from "./payloads.ts";

export type Slot = "zone" | "Infinity" | "alpha";

export type Cargo =
  | { kind: "veil"; box: Yank }
  | { kind: "sift"; box: Zeta }
  | { kind: "onyx"; box: Wisp };

export type CargoAlias = Cargo;

export type SpinMsg =
  | { kind: "wind"; turns: number }
  | { kind: "unwind" };

export type GadgetMsg = SpinMsg | { kind: "tap" };

export type CoreMsg =
  | { kind: "reset" }
  | { kind: "wind"; turns: number }
  | { kind: "boot"; slot: Slot };

export type Msg = GadgetMsg | CoreMsg;

export interface Model {
  load: CargoAlias;
  slot: Slot;
}

export function init(): Model {
  return { load: { kind: "onyx", box: { w: true } }, slot: "alpha" };
}

export function update(m: Model, msg: Msg): Model {
  switch (msg.kind) {
    case "boot":
      return { load: m.load, slot: msg.slot };
    case "wind":
      return { load: { kind: "sift", box: { z: msg.turns } }, slot: m.slot };
    default:
      return m;
  }
}

let state: Model = init();

export function boot(): number {
  state = update(state, { kind: "wind", turns: 3 });
  state = update(state, { kind: "boot", slot: "Infinity" });
  return state.load.kind === "sift" && state.slot === "Infinity" ? 1 : 0;
}

console.log("order ready");
