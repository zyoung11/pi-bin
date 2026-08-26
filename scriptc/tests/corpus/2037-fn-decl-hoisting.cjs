// JS function hoisting inside a function body: a nested `function f() {}`
// is live from scope entry, so references lexically ABOVE the declaration
// resolve (the suite's standard server layout), including mutual
// recursion between two hoisted declarations. And the TDZ story for a
// const whose OWN initializer registers a callback that captures it: the
// callback runs after the assign completes, so the read sees the value.
'use strict';
function main() {
  const ordered = collect(3);
  console.log(ordered.join('|'));
  function collect(n) {
    const acc = [];
    for (let i = 0; i < n; i++) {
      acc.push(label(i));
    }
    return acc;
  }
  function label(i) {
    return i % 2 === 0 ? 'even' + i : odd(i);
  }
  function odd(i) {
    return 'odd' + i;
  }
}
main();

// The self-capturing const: the timer callback reads the const the
// callback registration initializes.
function later() {
  const t = setTimeout(() => {
    console.log(typeof t === 'object' || typeof t === 'number' ? 'timer seen' : 'missing');
  }, 1);
}
later();
