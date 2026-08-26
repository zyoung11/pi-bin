// setTimeout/clearTimeout/setInterval/clearInterval as ISLAND globals —
// embedded npm code schedules on the same ref'd timer heap as static
// code (armed timers keep the process alive; the AI SDK's retry backoff
// is the motivating consumer). Byte-exact vs Node, exit 0 after the last
// timer drains.
import { runTimers } from "timerkit";

runTimers();
