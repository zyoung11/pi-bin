// Async/await in JS: the JSDoc @returns {Promise<void>} contextually types
// the bare `new Promise((resolve) => setTimeout(resolve, ms))` sleep idiom
// (without it JS inference lands on Promise<any> — the fence/island story;
// see the boundaries list).
'use strict';

/** @param {number} ms @returns {Promise<void>} */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @param {string} tag @param {number} ms */
async function step(tag, ms) {
  await sleep(ms);
  console.log("step", tag);
  return tag.length;
}

async function main() {
  console.log("start");
  const a = await step("alpha", 10);
  const b = await step("be", 5);
  /** @type {number[]} */
  const results = [];
  for (const tag of ["x", "yy"]) results.push(await step(tag, 1));
  console.log("lengths:", a, b, results.join("+"));
}

main();
console.log("kicked off");
