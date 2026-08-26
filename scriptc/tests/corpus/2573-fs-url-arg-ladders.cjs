// Two small Node argument contracts: URL.revokeObjectURL() with no
// argument throws ERR_MISSING_ARGS before any registry lookup, and
// fs._toUnixTimestamp (the utimes family's seconds coercion) passes
// finite numbers and numeric strings while rejecting non-finite numbers
// and objects with Node's exact ERR_INVALID_ARG_TYPE. (The negative-
// number arm answers now/1000 — time-dependent, so only its type is
// pinned here.)
'use strict';
const fs = require('fs');
const show = (fn) => {
  try {
    console.log('ret', fn());
  } catch (e) {
    console.log(`${e.name}|${e.code}|${e.message}`);
  }
};

show(() => { URL.revokeObjectURL(); });

show(() => fs._toUnixTimestamp(Infinity));
show(() => fs._toUnixTimestamp(-Infinity));
show(() => fs._toUnixTimestamp(NaN));
show(() => fs._toUnixTimestamp({}));
show(() => fs._toUnixTimestamp('nope'));
show(() => fs._toUnixTimestamp(1));
show(() => fs._toUnixTimestamp(1.5));
show(() => fs._toUnixTimestamp('1'));
show(() => fs._toUnixTimestamp('-1'));
show(() => fs._toUnixTimestamp(''));
show(() => Number.isFinite(fs._toUnixTimestamp(-1)));
