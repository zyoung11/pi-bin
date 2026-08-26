// A TYPE merged with a namespace re-export under ONE name: the value side
// is the namespace of ./constants, the type side is the union — importers
// use both meanings of 'Drink'.
export type Drink = 0 | 1;
export * as Drink from "./constants.ts";
