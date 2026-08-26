// URLSearchParams iteration: for-of yields [name, value] pairs (array
// destructuring binds straight from the reads; identifier heads get the
// [string, string] tuple), keys()/values()/entries() consumed by a
// for-of head ride the same walk, and forEach receives (value, name,
// searchParams). Iteration is LIVE and index-based like the spec's
// iterator: the size re-reads every pass, so appends mid-walk are
// visited and deletes shift the walk.
const sp = new URLSearchParams("a=1&b=2&c=3");
for (const [k, v] of sp) console.log("pair", k, v);
for (const [k] of sp) console.log("keyonly", k);
for (const e of sp) console.log("tuple", e[0], e[1], e.length);
for (const e of sp.entries()) console.log("entry", e[0], e[1]);
for (const k of sp.keys()) console.log("key", k);
for (const v of sp.values()) console.log("val", v);
sp.forEach((v, k) => console.log("fe2", k, v));
sp.forEach((v) => console.log("fe1", v));
sp.forEach((v, k, s) => console.log("fe3", k, v, s.size));
// Live: delete during for-of shifts later entries under the walk.
{
  const live = new URLSearchParams("a=1&b=2&c=3&d=4");
  const seen: string[] = [];
  for (const [k] of live) {
    seen.push(k);
    if (k === "a") live.delete("b");
  }
  console.log(seen.join(","), "|", live.toString());
}
// Live: appends during forEach are visited.
{
  const grow = new URLSearchParams("a=1");
  const seen: string[] = [];
  grow.forEach((v, k) => {
    seen.push(k);
    if (seen.length < 3) grow.append(k + "x", v);
  });
  console.log(seen.join(","));
}
// break/continue and an empty list.
{
  const few = new URLSearchParams("x=1&y=2&z=3");
  for (const [k] of few) {
    if (k === "x") continue;
    if (k === "z") break;
    console.log("mid", k);
  }
  for (const [k] of new URLSearchParams()) console.log("never", k);
}
