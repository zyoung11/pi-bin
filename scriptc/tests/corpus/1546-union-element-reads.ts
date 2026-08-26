// Number-keyed element reads over undefined-armed array unions — the
// chain-tail form `value?.split(":")[0]` (the array arm answers its
// element, the unit arm answers undefined — JS's whole-tail short-circuit).
function auth(u: string | undefined): string | undefined {
  if (!u) return undefined;
  return u.replace(/^https?:\/\//, "");
}
interface Route {
  hostname: string;
  tailscaleUrl: string | undefined;
}
const routes: Route[] = [
  { hostname: "app.local", tailscaleUrl: "https://ts.example:8443" },
  { hostname: "web.local", tailscaleUrl: undefined },
];
const hostname = "ts.example";
const hit = routes.find((r) => auth(r.tailscaleUrl)?.split(":")[0] === hostname);
console.log(hit ? hit.hostname : "(none)");
const miss = routes.find((r) => auth(r.tailscaleUrl)?.split(":")[0] === "nope");
console.log(miss ? miss.hostname : "(none)");
const first = auth("https://a.b:1")?.split(":")[1];
console.log(first ?? "(none)");
const none = auth(undefined)?.split(":")[0];
console.log(none ?? "(none)");
