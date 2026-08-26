// Payload records for lib.ts's Cargo union, deliberately declared in an
// order matching NEITHER the alphabet (Wisp, Yank, Zeta), NOR lib.ts's
// import list, NOR the order the union's arms reference them: the sidecar
// table must pin THIS file's declaration order — Zeta, Wisp, Yank — so a
// sorter anywhere (or any import-order leakage) reorders something the
// harness's exact-order assertions catch.
export interface Zeta {
  z: number;
}

export interface Wisp {
  w: boolean;
}

export interface Yank {
  y: string;
}
