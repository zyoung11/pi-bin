// The options-record stance beyond the http client: fs.watch accepts the
// options that STATE its lowered behavior (persistent: true, recursive:
// false, encoding: "utf8") plus undocumented keys (dropped, Node's own
// ignore), readline.createInterface accepts crlfDelay: Infinity (the
// lowered splitter's semantics exactly) and drops undocumented keys, and
// dns/tls keep their walks. Byte-exact: Node ignores every one of these
// the same way.
import * as fs from "node:fs";
import * as readline from "node:readline";
import { join } from "node:path";
import { tmpdir } from "node:os";

// fs.watch with the stated-default options object AND a listener: the
// three-argument form.
const dir = fs.mkdtempSync(join(tmpdir(), "scr-watch-opt-"));
const target = join(dir, "watched.txt");
fs.writeFileSync(target, "seed");
let fired = false;
const watcher = fs.watch(
  target,
  { persistent: true, recursive: false, encoding: "utf8", zorp: 1, blep: () => "never called" },
  (eventType) => {
    if (fired) return; // a delivery already queued when the first one closed us
    fired = true;
    clearInterval(kick);
    console.log("event:", eventType);
    watcher.close();
    fs.rmSync(dir, { recursive: true, force: true });
    console.log("closed");
    afterWatch();
  },
);
// The trigger RETRIES until the event lands. Node-on-macOS backs fs.watch
// with an FSEvents stream that starts asynchronously, so a single delayed
// write can slip into the startup window and be lost — the persistent
// watcher then holds the loop and the program hangs (this fixture's
// documented flake under machine load). Every kick is a rewrite-in-place
// of the live inode, "change" on every backend; the first delivered event
// closes everything, and the bound turns a genuinely dead watcher into a
// loud nonzero exit instead of a silent hang.
let kicks = 0;
const kick = setInterval(() => {
  if (fired) return;
  kicks += 1;
  if (kicks > 600) {
    console.error("watch event never delivered");
    process.exit(1);
  }
  fs.writeFileSync(target, "rewrite-" + String(kicks));
}, 50);

// The options-only two-argument form: opens, holds the loop, closes.
const dir2 = fs.mkdtempSync(join(tmpdir(), "scr-watch-opt2-"));
const silent = fs.watch(dir2, { persistent: true });
silent.close();
fs.rmSync(dir2, { recursive: true, force: true });
console.log("silent watcher closed");

function afterWatch(): void {
  // readline: crlfDelay: Infinity is the lowered splitter's behavior;
  // the undocumented key drops.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
    crlfDelay: Infinity,
    zorp: "dropped",
  });
  rl.close();
  console.log("rl closed");
}
