// @dynamic
// The island's WHATWG-streams subset, differentially against Node's REAL
// streams (the fixture package does all the work island-side and leaves
// its async chain pending — the loop drains island jobs at quiescence,
// like Node's microtask checkpoint).
import { run } from "webstream";

run();
