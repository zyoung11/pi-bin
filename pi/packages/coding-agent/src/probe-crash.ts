/**
 * Probe: spawnProcess with undefined cwd (the tmux-check call shape).
 * Build: scriptc build packages/coding-agent/src/probe-crash.ts --npm-static string_decoder
 */
import { spawnProcess } from "./utils/child-process.ts";

export function main(): void {
	console.log("s1: spawnProcess without cwd");
	const child = spawnProcess("echo", ["hi"], {
		stdio: ["ignore", "pipe", "ignore"],
	});
	console.log("s2: spawn ok, pid =", child.pid);
	child.kill();

	console.log("s3: spawnProcess with cwd");
	const child2 = spawnProcess("pwd", [], {
		cwd: "/tmp",
		stdio: ["ignore", "pipe", "pipe"],
	});
	console.log("s4: spawn ok, pid =", child2.pid);
	child2.kill();
	console.log("done");
}

main();
