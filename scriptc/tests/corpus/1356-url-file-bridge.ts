// fileURLToPath / pathToFileURL — the file-URL bridge CLIs lean on. Both
// receiver forms of fileURLToPath (URL value, URL string), the percent
// round-trip (spaces, %, non-ASCII UTF-8), and Node's TypeError messages.
import { fileURLToPath, pathToFileURL } from "node:url";

console.log(pathToFileURL("/tmp/a b/c%d").href);
console.log(pathToFileURL("/tmp/é🌍").href);
console.log(fileURLToPath("file:///tmp/a%20b/c%25d"));
console.log(fileURLToPath("file:///tmp/%C3%A9"));
console.log(fileURLToPath(new URL("file:///x/y")));
console.log(fileURLToPath("file:///"));
console.log(fileURLToPath("FILE:///upper"));

// Relative paths resolve against the cwd — same cwd in both runs.
console.log(fileURLToPath(pathToFileURL("rel/x")) === process.cwd() + "/rel/x");

// The round-trip holds for awkward names.
const p = "/tmp/space dir/100% legit";
console.log(fileURLToPath(pathToFileURL(p)) === p);
console.log(fileURLToPath(pathToFileURL(p).href) === p);

function fails(input: string): string {
  try {
    fileURLToPath(input);
    return "no-throw";
  } catch (e) {
    if (e instanceof TypeError) {
      return e.message;
    }
    return "not-a-typeerror";
  }
}
console.log(fails("http://x/y"));
console.log(fails("file:///a%2Fb"));
console.log(fails("file:///a%2fb"));
console.log(fails("file://host/a"));
console.log(fails("not a url"));
