// Reference cycles through maps: an object stored in a map that the object
// itself holds. Reference counting alone can never free these — the cycle
// collector must, and the sanitized lane's RC audit proves every dropped
// cycle is collected.
class Node2 {
  name: string;
  peers: Map<string, Node2>;
  constructor(name: string) {
    this.name = name;
    this.peers = new Map<string, Node2>();
  }
}

// self-cycle: a node lists itself as a peer
function self(i: number): string {
  const n = new Node2(`n${i}`);
  n.peers.set("me", n);
  const me = n.peers.get("me");
  if (me !== undefined) {
    return me.name;
  }
  return "?";
}
console.log(self(0));

// mutual cycle THROUGH the maps: a peers b, b peers a
function pair(i: number): number {
  const a = new Node2(`a${i}`);
  const b = new Node2(`b${i}`);
  a.peers.set("other", b);
  b.peers.set("other", a);
  const viaA = a.peers.get("other");
  if (viaA !== undefined) {
    const back = viaA.peers.get("other");
    if (back !== undefined) {
      return back.name.length;
    }
  }
  return -1;
}
console.log(pair(1));

// churn: hundreds of dropped cycles must all collect (SAN lane)
for (let i = 0; i < 300; i = i + 1) {
  self(i);
  pair(i);
}
console.log("churned");

// a live cycle stays alive while reachable, then drops
let keep = new Node2("kept");
keep.peers.set("me", keep);
console.log(keep.peers.size);
keep = new Node2("replaced"); // the old cycle becomes garbage
console.log(keep.name);

// cycle through a RECORD value: the record holds the node, the node's map
// holds the record's owner-by-proxy chain (node -> map -> record -> node)
interface Entry {
  label: string;
  owner: Node2;
}
class Ring {
  slots: Map<string, Entry>;
  constructor() {
    this.slots = new Map<string, Entry>();
  }
}
function ring(i: number): string {
  const n = new Node2(`r${i}`);
  const holder = new Ring();
  // n is reachable from the entry; give n's own map the entry's OWNER path
  // back through another node to close a longer loop
  const spoke = new Node2(`s${i}`);
  spoke.peers.set("hub", n);
  n.peers.set("spoke", spoke);
  holder.slots.set("e", { label: `e${i}`, owner: n });
  const e = holder.slots.get("e");
  if (e !== undefined) {
    const hubBack = e.owner.peers.get("spoke");
    if (hubBack !== undefined) {
      return hubBack.name;
    }
  }
  return "?";
}
console.log(ring(7));
for (let i = 0; i < 200; i = i + 1) {
  ring(i);
}
console.log("rings dropped");
