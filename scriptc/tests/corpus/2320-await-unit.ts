// `await null` / `await undefined` — bare-UNIT awaits (the async-hooks
// tests' turn-forcing idiom). JS awaits non-thenables through exactly one
// microtask turn and answers the unit itself; the lowering rides the
// unit-only union (bare units have no standalone representation). Every
// one of these was an SC9001 ICE (local "%awaited" has bare unit type
// nullT / bare unitLit outside a unionWrap).
const order: string[] = [];

async function main() {
  order.push("body-start");
  await null;
  order.push("after-await-null");
  await undefined;
  order.push("after-await-undefined");
  // Value position: the awaited unit IS the unit.
  const x = await null;
  order.push(`x-is-null:${x === null}`);
  const y = await undefined;
  order.push(`y-is-undefined:${y === undefined}`);
}

// The one-hop timing pins differentially: the body runs synchronously to
// the first await; each queued microtask interleaves with each hop.
Promise.resolve().then(() => order.push("micro1"));
main().then(() => {
  console.log(order.join(","));
});
Promise.resolve().then(() => order.push("micro2"));
order.push("sync-tail");
