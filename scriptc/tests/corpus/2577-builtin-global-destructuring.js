'use strict';
// Destructuring a STDLIB GLOBAL in a JavaScript file binds member
// IDENTITY TOKENS (the identifier chokepoint's rule one member deep):
// one global, one member, one interned string, so identity and
// truthiness agree with Node across every spelling, while what a token
// cannot do meets per-site rules lazily at each use. This program pins
// the AGREEING operations — identity across destructures, identity with
// the property spelling, truthiness — under the Node oracle.
const { crypto: wc } = globalThis;
console.log(!!wc);
console.log(wc === globalThis.crypto);

const { subtle } = globalThis.crypto;
const { subtle: again } = globalThis.crypto;
console.log(subtle === again);
console.log(!!subtle);

// A member destructured from the aliased binding IS the same member.
const { subtle: viaAlias } = wc;
console.log(viaAlias === subtle);

const { Console } = console;
console.log(!!Console);

// A globalThis member with a REAL surface destructures as the global
// itself (the stdlibGlobalAliasDecl twin): receiver uses route through
// the same lowerings as the bare spelling.
const { Math: M } = globalThis;
console.log(M.max(1, 2));
console.log(M === globalThis.Math);
