// The real-world shape: an emitter subclass as a job queue — constructor
// args + super(), own fields and methods, colon-spelled event names,
// multi-argument tuples, once('drain'), listeners registered from outside
// on a base-typed binding, and removeListener mid-flight.
import { EventEmitter } from "node:events";

interface Job {
  id: number;
  name: string;
}

class JobQueue extends EventEmitter {
  private jobs: Job[] = [];
  done = 0;
  readonly label: string;
  constructor(label: string) {
    super();
    this.label = label;
  }
  add(name: string): number {
    const job = { id: this.jobs.length + 1, name };
    this.jobs.push(job);
    this.emit("job:added", job.id, name);
    return job.id;
  }
  run(): void {
    for (const job of this.jobs) {
      this.emit("job:done", job.id, job.name, ++this.done);
    }
    this.jobs = [];
    this.emit("drain", this.done);
  }
}

const q = new JobQueue("build");
q.on("job:added", (id: number, name: string) => console.log(`[${q.label}] queued #${id} ${name}`));
const progress = (id: number, name: string, total: number): void => {
  console.log(`done #${id} ${name} (${total} total)`);
};
q.on("job:done", progress);
q.once("drain", (total: number) => console.log("drained after", total));

q.add("compile");
q.add("link");
q.run();

// Mid-flight removal: the second batch reports through a fresh listener
// only; drain's once-listener is already gone.
q.removeListener("job:done", progress);
q.on("job:done", (id: number) => console.log("quietly finished", id));
q.add("package");
q.run();
console.log(q.done, q.listenerCount("job:done"), q instanceof JobQueue, q instanceof EventEmitter);
