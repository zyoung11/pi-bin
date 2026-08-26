// A lying .d.ts: the types declare a default export the runtime module
// does not provide. Node validates named imports (default included) at
// link time — "The requested module 'phantomdts' does not provide an
// export named 'default'", exit 1, nothing printed. The island's import
// boundary throws the same SyntaxError: exit codes and stdout agree.
import phantom from "phantomdts";

console.log(phantom());
