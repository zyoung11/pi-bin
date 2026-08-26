// Dynamic import of SHIPPED LOCAL JS (a sibling .mjs typed by its .d.mts —
// the Emscripten-factory shape): the build embeds the file and the island
// evaluates it; and the honest rejection for a file no loader executes —
// Node rejects import() of an unknown extension with a catchable
// ERR_UNKNOWN_FILE_EXTENSION TypeError, and so does the compiled binary
// (the build succeeds; the failure is the runtime's, exactly where Node
// puts it).
async function run(): Promise<void> {
  const m = await import("./shape.mjs");
  const a: number = m.area(3, 4);
  console.log(a);
  console.log(m.describe("box"));
  console.log(m.default);
  // Unknown extension: catchable rejection, Node's error shape.
  try {
    await import("./data.txt");
    console.log("unexpectedly loaded");
  } catch (e) {
    if (e instanceof TypeError) {
      console.log("rejected:", e.message);
    } else {
      console.log("wrong error class");
    }
  }
  console.log("after");
}
run();
