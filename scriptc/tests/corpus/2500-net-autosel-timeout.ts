// node:net's process-wide happy-eyeballs attempt budget: the
// getDefaultAutoSelectFamilyAttemptTimeout/setDefaultAutoSelectFamilyAttemptTimeout
// pair round-trips one runtime double. Values stay integers >= 10 (Node
// clamps smaller settings up to 10ms; the fixture stays inside the
// clamp-free region so both implementations answer the stored value).
import {
  getDefaultAutoSelectFamilyAttemptTimeout,
  setDefaultAutoSelectFamilyAttemptTimeout,
} from "node:net";

setDefaultAutoSelectFamilyAttemptTimeout(300);
const a = getDefaultAutoSelectFamilyAttemptTimeout();
console.log(typeof a, a);

setDefaultAutoSelectFamilyAttemptTimeout(1234);
console.log(getDefaultAutoSelectFamilyAttemptTimeout());

setDefaultAutoSelectFamilyAttemptTimeout(10);
console.log(getDefaultAutoSelectFamilyAttemptTimeout());
