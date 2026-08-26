// Union re-tag with width-differing record arms: a source record arm with
// no identical destination arm width-copies into the one destination
// record arm it coerces into (the findRoute pattern), unit arms re-wrap.

interface Route {
  hostname: string;
  port: number;
  tailscaleUrl?: string;
}

function findRoute(routes: Route[], host: string, strict?: boolean): { hostname: string; port: number } | undefined {
  return (
    routes.find((r) => r.hostname === host) ||
    (strict ? undefined : routes.find((r) => host.endsWith("." + r.hostname)))
  );
}

const routes: Route[] = [
  { hostname: "a.test", port: 3000, tailscaleUrl: "https://x.ts.net" },
  { hostname: "b.test", port: 4000 },
];

const exact = findRoute(routes, "a.test");
console.log(exact ? `${exact.hostname}:${exact.port}` : "none");

const suffix = findRoute(routes, "www.b.test");
console.log(suffix ? `${suffix.hostname}:${suffix.port}` : "none");

console.log(findRoute(routes, "www.b.test", true) === undefined);
console.log(findRoute(routes, "missing.test") === undefined);

// The narrowed copy is a fresh value: reads work through it, and the
// dropped field is simply not part of the narrow type (tsc-invisible).
const narrow: { hostname: string; port: number } | undefined = routes.find((r) => r.port === 3000);
if (narrow !== undefined) {
  console.log(narrow.hostname, narrow.port);
}

// Field widening composes per arm: the source's optional field re-tags
// into the destination arm's optional field, and a MISSING optional
// completes to undefined in the copy.
function pickFirst(rs: Route[]): { hostname: string; tailscaleUrl?: string } | undefined {
  return rs.find(() => true);
}
const first = pickFirst(routes);
console.log(first ? `${first.hostname} ${first.tailscaleUrl}` : "none");
const second = pickFirst(routes.slice(1));
console.log(second ? `${second.hostname} ${second.tailscaleUrl}` : "none");
console.log("done");
