// @transform-types
// Assertion and satisfies boundaries build literals at their OWN shape.
// A type assertion on a WIDER literal narrows through the width copy at
// the next slot; `satisfies` never reshapes the value (its type — and the
// value's shape — stays the literal's own).
var foo = <{ id: number }>{ id: 4, name: "as" };
console.log(foo.id);

// `as` spelling of the same flow.
const bar = { id: 9, extra: true } as { id: number };
console.log(bar.id);

// The asserted value width-copies into downstream slots.
function useId(v: { id: number }): number {
  return v.id;
}
console.log(useId(<{ id: number }>{ id: 5, name: "n" }));

// satisfies: the literal keeps its own plain shape — every member stays a
// real field (an index-signature satisfies target must not absorb them).
type Movable = { move(distance: number): string };
const car = {
  start() {
    return "start";
  },
  move(d) {
    return "move " + d;
  },
  stop() {
    return "stop";
  },
} satisfies Movable & Record<string, unknown>;
console.log(car.move(4), car.start(), car.stop());

// satisfies over plain data: JSON sees the literal's own fields.
const cfg = { port: 8080, host: "localhost" } satisfies Record<string, number | string>;
console.log(JSON.stringify(cfg));