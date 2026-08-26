// URLSearchParams core: every lowered constructor init shape (omitted /
// undefined / string with one leading '?' stripped / string[][] pairs /
// inline record literal / another URLSearchParams as a SNAPSHOT copy)
// and the list methods — get (string | null), getAll, set (replace
// first, drop rest), append, delete (name and name+value forms), has
// (name and name+value forms), sort (stable), size, toString. Node is
// the oracle; the pairs form throws Node's ERR_INVALID_TUPLE TypeError.
const sp = new URLSearchParams("a=1&b=2&a=3");
console.log(sp.toString());
console.log(JSON.stringify(sp.get("a")), JSON.stringify(sp.get("zz")));
console.log(sp.getAll("a").join(","), sp.getAll("nope").length);
sp.append("c d", "x y+z");
console.log(sp.toString());
sp.set("a", "9");
console.log(sp.toString());
sp.set("brand", "new");
console.log(sp.toString());
sp.delete("b");
console.log(sp.toString(), sp.size, sp.has("a"), sp.has("a", "8"), sp.has("a", "9"));
sp.sort();
console.log(sp.toString());
// Stable sort: equal names keep their relative order.
const st = new URLSearchParams("k=3&k=1&a=0&k=2");
st.sort();
console.log(st.toString());
// Value-aware delete removes only matching pairs.
const dv = new URLSearchParams("a=1&a=2&a=1&b=9");
dv.delete("a", "1");
console.log(dv.toString(), dv.has("b", "9"), dv.has("b", "8"), dv.has("zz"));
// Constructor forms.
console.log(new URLSearchParams("?lead=1").toString());
console.log(new URLSearchParams("??keep=1").toString());
console.log(new URLSearchParams().size, new URLSearchParams(undefined).size);
const rec = new URLSearchParams({ a: "1", "b c": "2 3" });
console.log(rec.toString());
const pairs: string[][] = [["k", "v"], ["k", "w"], ["s p", "q+r"]];
console.log(new URLSearchParams(pairs).toString());
const copy = new URLSearchParams(rec);
copy.append("q", "r");
console.log(rec.toString(), "|", copy.toString());
// A non-[name, value] row throws Node's catchable ERR_INVALID_TUPLE.
try {
  const bad: string[][] = [["a", "b", "c"]];
  new URLSearchParams(bad);
} catch (e) {
  if (e instanceof TypeError) console.log("caught", e.name, e.message);
}
try {
  const short: string[][] = [["only"]];
  new URLSearchParams(short);
} catch (e) {
  if (e instanceof TypeError) console.log("caught", e.name, e.message);
}
