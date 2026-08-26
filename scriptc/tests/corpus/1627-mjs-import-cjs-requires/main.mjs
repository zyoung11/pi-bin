// The ESM entry: its import HOISTS — cjspart (and base, mid-body) run
// before the entry's own first statement, however the source is ordered.
console.log('entry: first');
import { six } from './cjspart.js';
console.log('entry:', six);
