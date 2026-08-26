// Prototype-method dispatch on checked-dynamic receivers (scr_dyn_invoke):
// the shared Array/String/Function prototype names dispatch on the
// receiver's RUNTIME kind — arrays run the real methods (callbacks see
// (elem, i)), functions take apply/call, objects call own members, and a
// name the kind's prototype lacks throws Node's catchable TypeError.
'use strict';

function dyn(v) { return v; } // an identity that erases static types

const arr = dyn([3, 1, 2]);
console.log('len', arr.push(9, 4));
console.log('pop', arr.pop());
console.log('shift', arr.shift());
console.log('unshift', arr.unshift(7, 8));
console.log('slice', arr.slice(1, 3).join('|'));
console.log('slice-neg', arr.slice(-2).join(','));
console.log('at', arr.at(0), arr.at(-1), arr.at(99));
console.log('indexOf', arr.indexOf(2), arr.indexOf('nope'));
console.log('lastIndexOf', arr.lastIndexOf(9));
console.log('includes', arr.includes(8), arr.includes(0));
console.log('join', arr.join(' + '), arr.join());
console.log('concat', arr.concat([100, 200], 300).join(','));
arr.forEach(function(v, i) { console.log('each', i, v); });
console.log('map', arr.map(function(v) { return v * 10; }).join(','));
console.log('filter', arr.filter(function(v) { return v > 2; }).join(','));
console.log('some', arr.some(function(v) { return v > 8; }));
console.log('every', arr.every(function(v) { return v > 0; }));
console.log('find', arr.find(function(v) { return v > 7; }));
console.log('findIndex', arr.findIndex(function(v) { return v === 2; }));
console.log('reverse', arr.reverse().join(','));

// Function receivers: apply spreads an array, call passes the tail.
const f = dyn(function add3(a, b, c) { return `${a}:${b}:${c}`; });
console.log('apply', f.apply(null, ['x', 'y', 'z']));
console.log('apply-none', f.apply(undefined));
console.log('call', f.call(null, 1, 2, 3));

// Object receivers: the own member calls; a missing name is Node's
// catchable "is not a function".
const obj = dyn({ greet: function(who) { return `hi ${who}`; } });
console.log('own', obj.greet('there'));
try {
  obj.forEach(function() {});
} catch (e) {
  console.log('caught:', e instanceof TypeError ? e.message : 'wrong');
}
try {
  const n = dyn(42);
  n.push(1);
} catch (e) {
  console.log('caught:', e instanceof TypeError ? e.message : 'wrong');
}

console.log('done');
