// url.searchParams is the LIVE view of the URL's query, one cached
// object per URL (Node's identity): mutations through it re-serialize
// the list into the URL's query — href and search reflect immediately,
// re-encoded through the urlencoded serializer (a '+' that parsed as a
// space re-serializes as '+'; '?a+b=c' stays byte-stable) — and
// emptying the list drops the '?' entirely (the spec's null query).
// url.search is the WHATWG getter: '' for no query AND for a bare '?'.
// A URLSearchParams COPY of the view is a snapshot — mutating it never
// touches the URL.
const u = new URL("https://ex.com/p?a=1");
console.log(u.search, u.searchParams.size);
u.searchParams.append("b", "2 3");
console.log(u.href, u.search, u.searchParams.toString());
const alias = u.searchParams;
alias.set("a", "zz");
console.log(u.search, u.href);
alias.sort();
console.log(u.href);
alias.delete("a");
alias.delete("b");
console.log(u.href, JSON.stringify(u.search), alias.size);
alias.append("late", "1");
console.log(u.href);
// The urlencoded reparse: URL query '+' means space through the view.
const plus = new URL("http://h/p?a+b=c+d&u=%C3%A9");
console.log(JSON.stringify(plus.searchParams.get("a b")), JSON.stringify(plus.searchParams.get("u")));
plus.searchParams.append("w", "x y");
console.log(plus.href);
// search getter edges: no query, bare '?', fragment after query.
console.log(JSON.stringify(new URL("http://h/p").search));
console.log(JSON.stringify(new URL("http://h/p?").search));
console.log(new URL("http://h/p?q=1#frag").search, new URL("http://h/p?q=1#frag").searchParams.toString());
// Snapshot copies detach from the URL.
const src = new URL("http://h/x?k=v");
const snap = new URLSearchParams(src.searchParams);
snap.append("more", "1");
console.log(src.href, "|", snap.toString());
// Two URLs never share a view.
const u1 = new URL("http://h/1?z=1");
const u2 = new URL("http://h/2?z=2");
u1.searchParams.set("z", "one");
console.log(u1.search, u2.search);
