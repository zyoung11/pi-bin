// package.json-mediated PROJECT imports: the `#alias` imports field and the
// self-name reference (the nearest package.json's own name through its
// exports) resolve to the program's own sources — ordinary user-module
// edges, exactly like relative imports. Node resolves the same specifiers
// at runtime (the targets name the .ts sources directly), so this program
// is a true differential: same graph, same output, both lanes.
import { double, tag } from "#util";
import { extra } from "#lib/extra.ts";
import { greeting } from "pkgimports-corpus/greet";

console.log(double(21), tag, extra, greeting);
