// Object.keys/values/entries over CHECKED-DYNAMIC objects (the JS
// file-scope object-literal identity story): the runtime walks the checked-dynamic tree
// node's own keys in JS own-key order (array-index keys ascending
// first); null/undefined throw Node's catchable TypeError. This was an
// ICE before the walk existed (the record helper received a dyn value).
'use strict';
const eventPhases = { 'NONE': 0, 'CAPTURING_PHASE': 1, 'AT_TARGET': 2, 'BUBBLING_PHASE': 3 };
console.log(JSON.stringify(Object.keys(eventPhases)));
console.log(JSON.stringify(Object.values(eventPhases)));
console.log(JSON.stringify(Object.entries(eventPhases)));
const mixed = { b: 'x', '2': 'two', a: 'y', '0': 'zero' };
console.log(JSON.stringify(Object.keys(mixed)));
console.log(JSON.stringify(Object.entries(mixed)));
try { Object.keys(null); } catch (e) { console.log(e.name, e.message); }
try { Object.entries(undefined); } catch (e) { console.log(e.name, e.message); }
