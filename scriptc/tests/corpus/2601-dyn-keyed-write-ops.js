// Keyed writes where the OBJECT is the dynamic thing: JSON.parse receivers
// and unknown-lowered lets take the dyn keyed write (dyn.keySet) — later
// writes win, number keys stringify (ToPropertyKey), values convert into
// the checked-dynamic tree — with dyn-keyed reads, Object.keys' own-key order (index keys
// first), a dyn MEMBER receiver, and Node's TypeErrors on non-object
// receivers (null's "Cannot set properties", the strict-mode "Cannot
// create property" on primitives).
'use strict';
const o = JSON.parse('{"a":1}');
const k = 'b' + '';
o[k] = 2;
o[k] = 3;
o['c'] = 'str';
o[7] = true;
console.log(o.a, o[k], o.c, o['7']);
console.log(Object.keys(o).join(','));
const nested = JSON.parse('{"cfg":{}}');
nested.cfg['depth' + ''] = 2;
console.log(nested.cfg.depth);
try {
  JSON.parse('null')['x'] = 1;
} catch (e) {
  console.log('caught:', e.message);
}
try {
  JSON.parse('5')['x'] = 1;
} catch (e) {
  console.log('caught:', e.message);
}
console.log('done');
