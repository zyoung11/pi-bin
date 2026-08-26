// fs.watch: "change" on a rewrite-in-place, "rename" when the name moves,
// the synchronous ENOENT throw (the polling-fallback catch shape), close()
// idempotence, and loop liveness (an open watcher holds the process; the
// program exits once every watcher closes). Each phase closes on its FIRST
// event — kqueue and FSEvents coalesce differently, so exact event counts
// are deliberately unobserved. Triggers RETRY on an interval until the
// event lands: Node-on-macOS's FSEvents stream starts asynchronously, so a
// single delayed touch can slip into the startup window and be lost, the
// persistent watcher holding the loop forever (1751's documented flake
// shape). The bound turns a genuinely dead watcher into a loud nonzero
// exit instead of a silent hang.
import * as fs from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const dir = fs.mkdtempSync(join(tmpdir(), "scr-watch-"));
const target = join(dir, "watched.txt");
fs.writeFileSync(target, "seed");

// The unopenable path throws Node's fs error NOW, synchronously.
try {
  fs.watch(join(dir, "missing.txt"));
  console.log("no throw");
} catch (e) {
  if (e instanceof Error) {
    console.log("throws ENOENT:", e.message.startsWith("ENOENT: no such file or directory, watch"));
  }
}

// Phase 2 (started from phase 1's close): the name disappearing delivers
// "rename" to a zero-parameter listener; the FSWatcher | null local is
// the portless watcher shape. The retried trigger alternates the name out
// of and back into existence — every flip is a name event, so the phase
// completes on whichever delivery arrives first.
let renameWatcher: fs.FSWatcher | null = null;
function startRenamePhase(): void {
  const mover = join(dir, "mover.txt");
  fs.writeFileSync(mover, "m");
  let renameFired = false;
  renameWatcher = fs.watch(mover, () => {
    if (renameFired) return; // a delivery already queued when the first one closed us
    renameFired = true;
    clearInterval(renameKick);
    console.log("rename phase fired");
    if (renameWatcher) {
      renameWatcher.close();
      renameWatcher.close(); // idempotent, like Node
      renameWatcher = null;
    }
    fs.rmSync(dir, { recursive: true, force: true });
    console.log("all closed");
  });
  let renameKicks = 0;
  const renameKick = setInterval(() => {
    if (renameFired) return;
    renameKicks += 1;
    if (renameKicks > 600) {
      console.error("rename event never delivered");
      process.exit(1);
    }
    if (fs.existsSync(mover)) {
      fs.rmSync(mover);
    } else {
      fs.writeFileSync(mover, "m");
    }
  }, 50);
}

// Phase 1: a rewrite-in-place delivers "change" with the event type; the
// retried trigger appends to the live inode until the event lands.
let changeWatcher: fs.FSWatcher | null = null;
let changeFired = false;
changeWatcher = fs.watch(target, (eventType) => {
  if (changeFired) return; // a delivery already queued when the first one closed us
  changeFired = true;
  clearInterval(changeKick);
  console.log("event:", eventType);
  if (changeWatcher) {
    changeWatcher.close();
    changeWatcher = null;
  }
  startRenamePhase();
});
console.log("watching");
let changeKicks = 0;
const changeKick = setInterval(() => {
  if (changeFired) return;
  changeKicks += 1;
  if (changeKicks > 600) {
    console.error("change event never delivered");
    process.exit(1);
  }
  fs.appendFileSync(target, "-more");
}, 50);
