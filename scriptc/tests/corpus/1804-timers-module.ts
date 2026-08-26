// The node:timers module forms are the globals (Node re-exports them):
// named imports with aliases, the namespace object, and mixing them with
// the ambient globals all drive one timer heap and one immediate queue.
// Everything is scheduled from inside one root timer, so ordering is the
// heap's FIFO-at-equal-deadline rule — no immediate-vs-fresh-timer race.
import { setTimeout as st, setImmediate as si, clearInterval as ci, clearImmediate } from "node:timers";
import * as timers from "node:timers";

let ticks = 0;
const onTick = (): void => {
  ticks++;
  console.log("tick", ticks);
  if (ticks === 2 && slow !== null && fast !== null) {
    ci(slow);
    timers.clearInterval(fast);
  }
};
let fast: ReturnType<typeof setInterval> | null = null;
let slow: ReturnType<typeof setInterval> | null = null;
st(() => {
  console.log("root");
  const dead = si(() => {
    console.log("never");
  });
  si(() => {
    console.log("immediate ran");
  });
  clearImmediate(dead);
  fast = timers.setInterval(onTick, 1);
  slow = timers.setInterval(() => {
    console.log("slow never ticks");
  }, 60 * 1000);
}, 1);
console.log("main done");
