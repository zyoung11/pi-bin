import { spawn, spawnSync } from "node:child_process";

export function p4(command: string, args: string[], env: Record<string, string | undefined>) {
	return spawn(command, args, { env, stdio: ["ignore", "pipe", "pipe"] });
}
export function p5(command: string, args: string[], cwd: string) {
	return spawnSync(command, args, { cwd, encoding: "utf8" });
}
export function p6(command: string, args: string[]) {
	return spawnSync(command, args, { encoding: "utf8" });
}
export function p7(command: string, args: string[], cwd: string, env: Record<string, string | undefined>) {
	return spawnSync(command, args, { cwd, env, encoding: "utf8" });
}
