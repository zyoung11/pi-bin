// util.inspect over checked-dynamic values (unknown): the runtime walks
// the dyn itself — scalars, arrays (grid grouping included), objects
// with runtime-quoted keys, depth placeholders — and format's %s passes
// dyn strings verbatim. Keys stay in insertion order with no
// integer-like keys after string keys (the checked-dynamic tree's documented Object.keys
// stance). Node is the oracle byte-for-byte.
import { format, inspect } from "node:util";

const scalars: unknown = JSON.parse('[1,-0.5,"two",true,false,null]');
console.log(inspect(scalars));

console.log(inspect(JSON.parse("1e21")));
console.log(inspect(JSON.parse('"it\'s"')));
console.log(inspect(JSON.parse("true")));
console.log(inspect(JSON.parse("null")));

const tree: unknown = JSON.parse('{"a":[1,2],"s":"x","n":null,"deep":{"x":{"y":{"z":1}}}}');
console.log(inspect(tree));

const grid: unknown = JSON.parse(`[${Array.from({ length: 30 }, (_, i) => i).join(",")}]`);
console.log(inspect(grid));

const strings: unknown = JSON.parse('["alpha","beta","gamma","delta","epsilon","zeta","eta","theta"]');
console.log(inspect(strings));

const quotedKeys: unknown = JSON.parse('{"a-b":1,"ok_1":2,"k l":3,"__proto__x":4}');
console.log(inspect(quotedKeys));

const mixed: unknown = JSON.parse('[{"name":"first","values":[1,2,3]},{"name":"second","values":[4,5,6]}]');
console.log(inspect(mixed));

// depth options apply to the runtime walk too
const deep: unknown = JSON.parse('{"l1":{"l2":{"l3":{"l4":1}}}}');
console.log(inspect(deep));
console.log(inspect(deep, { depth: 0 }));
console.log(inspect(deep, { depth: null }));

// format: dyn strings pass VERBATIM through %s (no quotes); composites inspect
const dynStr: unknown = JSON.parse('"raw text"');
console.log(format("%s!", dynStr));
const dynArr: unknown = JSON.parse("[1,2]");
console.log(format("%s!", dynArr));
console.log(format("rest:", dynStr, dynArr));
