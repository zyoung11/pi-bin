// Shadowing spellings must not collide narrowing keys —
// a callback parameter shadowing the switch subject, and a redundant
// nested switch whose continuation re-reads the outer narrowing. The
// literal arguments enter Entry/Ev through the per-field widening
// admission ({ kind: "score", value: null, bonus: 1 } picks its arm
// by the kind discriminant and value's null fit).
type Entry =
  | { readonly kind: "score"; readonly value: number | null; readonly bonus: number }
  | { readonly kind: "empty" };
function total(e: Entry, others: readonly Entry[]): number {
  switch (e.kind) {
    case "score": {
      const anyPositive = others.some((e) => (e.kind === "score" ? e.bonus > 0 : false));
      const boost = anyPositive ? 1 : 0;
      if (e.value !== null) {
        return e.value + e.bonus + boost;
      }
      return e.bonus + boost;
    }
    case "empty":
      return 0;
  }
}
type Ev =
  | { readonly kind: "hit"; readonly value: number }
  | { readonly kind: "miss" };
function nestedSwitch(e: Ev): number {
  switch (e.kind) {
    case "hit": {
      let bonus = 0;
      switch (e.kind) {
        case "hit": {
          bonus = e.value * 2;
          break;
        }
        default:
          break;
      }
      return e.value + bonus;
    }
    case "miss":
      return 0;
  }
}
const others: Entry[] = [{ kind: "score", value: null, bonus: 1 }, { kind: "empty" }];
console.log(total({ kind: "score", value: 3, bonus: 2 }, others));
console.log(total({ kind: "score", value: null, bonus: 2 }, []));
console.log(total({ kind: "empty" }, others));
console.log(nestedSwitch({ kind: "hit", value: 3 }));
console.log(nestedSwitch({ kind: "miss" }));
