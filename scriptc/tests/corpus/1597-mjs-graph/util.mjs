// ESM JavaScript module: named exports, JSDoc-typed params, module state.
'use strict';

let uses = 0;

/** @param {string} s */
export function shout(s) {
  uses += 1;
  return s.toUpperCase() + "!";
}

export function useCount() {
  return uses;
}

export const MOTTO = "modules all the way down";
