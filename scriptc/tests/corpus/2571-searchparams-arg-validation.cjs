// URLSearchParams' WHATWG argument ladders, Node-exact: method values
// through Function.prototype.call with a non-URLSearchParams receiver
// throw ERR_INVALID_THIS before any conversion; too few arguments throw
// ERR_MISSING_ARGS; name/value slots convert with ToPrimitive's string
// hint (a user toString runs and its throw propagates; symbols can never
// convert); units and numbers render through ToString like any JS value.
'use strict';
const show = (fn) => {
  try {
    console.log('ret', JSON.stringify(fn()));
  } catch (e) {
    console.log(`${e.name}|${e.code}|${e.message}`);
  }
};
const params = new URLSearchParams('a=1&b=2');

// ERR_INVALID_THIS: the brand check runs first.
show(() => params.get.call(undefined));
show(() => params.getAll.call(null));
show(() => params.has.call(42));
show(() => params.append.call('x'));
show(() => params.delete.call(undefined));
show(() => params.set.call(undefined));
show(() => params.forEach.call(undefined));
show(() => params.toString.call(undefined));

// ERR_MISSING_ARGS: the arity ladder.
show(() => params.get());
show(() => params.getAll());
show(() => params.has());
show(() => params.delete());
show(() => params.append('a'));
show(() => params.set('a'));

// The string-hint conversions: user toString (throwing and answering),
// valueOf fallback never runs for the string hint when toString exists,
// symbols throw, units and numbers render.
const thrower = { toString() { throw new Error('toString'); }, valueOf() { throw new Error('valueOf'); } };
show(() => params.get(thrower));
show(() => params.set(thrower, 'b'));
show(() => params.set('a', thrower));
const answering = { toString() { return 'a'; } };
show(() => params.get(answering));
const sym = Symbol();
show(() => params.get(sym));
show(() => params.set(sym, 'b'));
show(() => params.set('a', sym));
show(() => params.get(null));
show(() => params.get(123));
show(() => params.get(undefined));

// The stringifier's re-serialization after sort (its percent-encoding
// rules differ from URL's own).
const myUrl = new URL('https://example.org?foo=~bar');
console.log(myUrl.search);
myUrl.searchParams.sort();
console.log(myUrl.search);
