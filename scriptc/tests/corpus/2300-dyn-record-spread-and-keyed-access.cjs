// Record-typed CHECKER shapes over VALUES living in the checked-dynamic tree (the JS
// file-scope object-literal identity story): spread copies read each field
// from the checked-dynamic tree and validate into the shape's field type (dynKeyGet +
// dynCheck — the member-read discipline); keyed reads/writes (bracket and
// dot spellings, literal and runtime keys) ride dynKeyGet / dyn.keySet.
// Every one of these was an SC9001 ICE (recordGet/recordKeyGet/recordKeySet
// receiver: expected record, got dyn) before the dispatch learned the checked-dynamic tree.
'use strict';
const conf = { host: 'nodejs.org', port: '443' };

// Spread of the checked-dynamic tree-holding const into a fresh literal (+ later override).
const copy = { ...conf, proto: 'https' };
console.log(copy.host, copy.port, copy.proto);
const overridden = { ...conf, port: '8080' };
console.log(overridden.host, overridden.port);

// Keyed writes: literal key, runtime key (the common/internet.js loop).
conf['host'] = 'example.com';
const k = 'port';
conf[k] = '80';
console.log(conf.host, conf[k]);

// A jsdoc index-signature shape: dot and bracket reads/writes over the checked-dynamic tree.
/** @type {Object<string,string>} */
const mmap = { bye: 'no' };
mmap.ignoreMe = 'ok but just because of the index signature';
mmap['hi'] = 'yes';
const rk = 'hi';
console.log(mmap.bye, mmap.ignoreMe, mmap[rk]);
