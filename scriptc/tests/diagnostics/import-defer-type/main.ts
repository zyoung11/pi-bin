// `import defer type * as ns` arrives with no readable specifier text — the
// preflight edge collector must skip it, not crash (invariant signature 06);
// the checker's own parse errors gate the build.
import defer type * as ns1 from "./a";
