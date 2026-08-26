// fs/promises' certs-pipeline tail: mkdir with { recursive, mode },
// chmod, unlink — settled-promise forms of the sync ops; failures
// REJECT (catchable at the await).
import * as fs from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
async function main(): Promise<void> {
  const dir = fs.mkdtempSync(join(tmpdir(), "scr-fsp-"));
  await fs.promises.mkdir(join(dir, "a/b"), { recursive: true, mode: 0o755 });
  console.log("made:", fs.existsSync(join(dir, "a/b")));
  const f = join(dir, "a/b/f.txt");
  await fs.promises.writeFile(f, "x");
  await fs.promises.chmod(f, 0o600);
  console.log("mode:", (fs.statSync(f).size));
  await fs.promises.unlink(f);
  console.log("gone:", !fs.existsSync(f));
  try {
    await fs.promises.unlink(f);
  } catch (e) {
    if (e instanceof Error) console.log("rejects:", e.message.startsWith("ENOENT"));
  }
  fs.rmSync(dir, { recursive: true, force: true });
}
main();
