// `import.defer(...)` panics tsgo's checker when asked for the callee's type
// (upstream signature 02); scriptc's own MetaProperty fence answers first at
// lowering — a named fence, never a crashed CLI.
import.defer("./a.js").then((ns) => { ns.foo(); });
