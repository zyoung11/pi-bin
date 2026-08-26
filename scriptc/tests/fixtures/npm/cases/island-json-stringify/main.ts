// JSON.stringify of ISLAND values (the error-inspection catch-22): the
// engine's own JSON.stringify runs — key order, nesting, and the space
// argument match Node by construction — and the result exits at the
// declared string type, so static string consumers work on it directly.
import { issueOf, pair, parts } from "arrpack";

const issue = issueOf("boom");

// The whole handle, compact and pretty (the engine's own space rules).
console.log(JSON.stringify(issue));
console.log(JSON.stringify(issue, null, 2));

// A nested member handle (the zod `error.issues` shape).
console.log(JSON.stringify(issue.path));

// Direct call-result handles, array- and tuple-typed.
console.log(JSON.stringify(parts("a,b")));
console.log(JSON.stringify(pair()));

// The result is a STATIC string: intrinsics run on it directly.
const s = JSON.stringify(issue);
console.log(s.length, s.startsWith("{\"code\"") ? "yes" : "no");

// Adjacent expressiveness stays: String(), templates, concatenation.
console.log(String(issue.path));
console.log(`tag=${issue.code}:${JSON.stringify(issue.path)}`);
