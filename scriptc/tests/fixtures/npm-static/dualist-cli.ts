// The "node" exports condition wins over "default" for an opted-in
// package — Node runs ./node.js (yaml's browser-vs-node shape), so the
// static compile must land on the same artifact, not the browser build.
import { where } from "dualist";

console.log(where());
