// os.networkInterfaces(): getifaddrs(3) behind Node's exact result shape —
// Dict<NetworkInterfaceInfo[]>, rows selected and filled like libuv/Node
// (IFF_UP && IFF_RUNNING, internal = loopback, MAC from the link-level
// sibling, cidr from the netmask prefix, scopeid on IPv6 rows only). The
// data is machine-dependent, so everything prints STRUCTURALLY (sorted
// keys; rows via explicit fields) — Node runs the same program on the same
// machine and must agree byte-for-byte. Node guarantees no enumeration
// order, so nothing here depends on it.
import { networkInterfaces } from "node:os";

const ifs = networkInterfaces();
const names = Object.keys(ifs);
names.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

for (const name of names) {
  const rows = ifs[name];
  if (!rows) continue;
  const lines: string[] = [];
  for (const r of rows) {
    // The family test narrows the union: scopeid/cidr read per arm.
    if (r.family === "IPv6") {
      lines.push(
        `  IPv6 address=${r.address} netmask=${r.netmask} mac=${r.mac} internal=${r.internal} cidr=${r.cidr} scopeid=${r.scopeid}`
      );
    } else {
      lines.push(
        `  IPv4 address=${r.address} netmask=${r.netmask} mac=${r.mac} internal=${r.internal} cidr=${r.cidr}`
      );
    }
  }
  lines.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  console.log(`${name}:`);
  for (const l of lines) console.log(l);
}

// The loopback interface: internal, zero MAC, 127.0.0.1 — the invariants
// the lan-ip probe leans on (mac parses, internal flags read).
let sawLoopback = false;
for (const name of names) {
  const rows = ifs[name];
  if (!rows) continue;
  for (const r of rows) {
    if (r.internal && r.family === "IPv4" && r.address === "127.0.0.1") {
      sawLoopback = true;
      console.log(`loopback: ${name} mac=${r.mac} cidr=${r.cidr}`);
    }
  }
}
console.log("saw loopback:", sawLoopback);

// Object.keys over a row follows Node's insertion order — scopeid appears
// only on IPv6 rows (the key is absent on IPv4 rows, exactly Node).
let didV4 = false;
let didV6 = false;
for (const name of names) {
  const rows = ifs[name];
  if (!rows) continue;
  for (const r of rows) {
    if (!didV4 && r.family === "IPv4") {
      didV4 = true;
      console.log(`IPv4 keys: ${Object.keys(r).join(",")}`);
    }
    if (!didV6 && r.family === "IPv6") {
      didV6 = true;
      console.log(`IPv6 keys: ${Object.keys(r).join(",")}`);
    }
  }
}

// The lan-ip.ts access pattern: find the row for a known address.
function findInterfaceRowForIp(ip: string): { iname: string; address: string; mac: string; internal: boolean } | null {
  for (const iname of Object.keys(ifs)) {
    const entries = ifs[iname];
    if (!entries) continue;
    for (const e of entries) {
      if (e.family !== "IPv4") continue;
      if (e.address !== ip) continue;
      return { iname, address: e.address, mac: e.mac, internal: e.internal };
    }
  }
  return null;
}
const lo = findInterfaceRowForIp("127.0.0.1");
console.log(lo ? `${lo.iname} ${lo.address} ${lo.mac} ${lo.internal}` : "no loopback");
