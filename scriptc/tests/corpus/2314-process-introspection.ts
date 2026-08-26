// The process introspection statics: uptime (seconds since start),
// cpuUsage/threadCpuUsage ({user, system} microsecond records; the prev
// form diffs and validates Node-style — the ERR_INVALID_ARG_VALUE
// RangeError with the received number, user checked before system),
// resourceUsage (getrusage's 16 fields, Node's names and key order), the
// memory reads, and getActiveResourcesInfo over the loop's timers and
// immediates (armed, firing, cleared — Node's lifetime).
const up = process.uptime();
console.log("uptime sane:", up >= 0 && up < 120);

const c1 = process.cpuUsage();
console.log("cpu shape:", c1.user >= 0 && c1.system >= 0);
const c2 = process.cpuUsage(c1);
console.log("cpu diff:", c2.user >= 0 && c2.system >= 0);
try {
  process.cpuUsage({ user: -1, system: 2 });
} catch (e) {
  if (e instanceof RangeError) console.log("cpu prev user:", e.name, e.message);
}
try {
  process.cpuUsage({ user: 3, system: -Infinity });
} catch (e) {
  if (e instanceof RangeError) console.log("cpu prev system:", e.name, e.message);
}

const t1 = process.threadCpuUsage();
const t2 = process.threadCpuUsage(t1);
console.log("thread cpu:", Number.isFinite(t1.user) && t1.system >= 0 && Number.isFinite(t2.user));

const ru = process.resourceUsage();
console.log("rusage keys:", Object.keys(ru).join(","));
console.log("rusage sane:", ru.userCPUTime >= 0 && ru.maxRSS > 0 && ru.minorPageFault >= 0);

console.log("avail:", process.availableMemory() >= 0);
console.log("constrained:", process.constrainedMemory() >= 0);

console.log("no handles:", JSON.stringify(process.getActiveResourcesInfo().filter((t) => t === "Timeout")));
const h = setTimeout(() => {
  // Firing, uncleared: still active (Node's Timeout lifetime)...
  console.log("firing:", process.getActiveResourcesInfo().filter((t) => t === "Timeout").length);
  clearTimeout(h);
  // ...and clearTimeout from inside drops it immediately.
  console.log("cleared:", process.getActiveResourcesInfo().filter((t) => t === "Timeout").length);

  const im = setImmediate(() => {
    // A FIRED immediate no longer counts (Node's current answer).
    console.log("immediate firing:", process.getActiveResourcesInfo().filter((t) => t === "Immediate").length);
  });
  console.log("immediate armed:", process.getActiveResourcesInfo().filter((t) => t === "Immediate").length);
  void im;
}, 0);
console.log("armed:", JSON.stringify(process.getActiveResourcesInfo().filter((t) => t === "Timeout")));
