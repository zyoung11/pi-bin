import * as facade from "./facade.ts";
import { ok, fileURLToPath } from "./facade.ts";
ok(1 === 1);
facade.ok(2 > 1);
facade.strictEqual("x", "x");
console.log(fileURLToPath("file:///tmp/some file.txt"));
console.log(facade.fileURLToPath("file:///tmp/other.txt"));
try {
  facade.ok(false, "named message");
} catch (e) {
  console.log((e as Error).message);
}
