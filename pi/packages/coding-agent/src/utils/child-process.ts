import { type ChildProcess, spawn as nodeSpawn, spawnSync as nodeSpawnSync } from "node:child_process";

const EXIT_STDIO_GRACE_MS = 100;

export type SpawnStdio = "inherit" | "ignore" | "pipe" | ("pipe" | "ignore" | "inherit" | number)[];

export interface SpawnProcessOptions {
	cwd?: string;
	env?: Record<string, string | undefined>;
	stdio?: SpawnStdio;
	detached?: boolean;
	windowsHide?: boolean;
	shell?: boolean | string;
}

export interface SpawnSyncOptions {
	cwd?: string;
	env?: Record<string, string | undefined>;
	stdio?: SpawnStdio;
	encoding?: "utf-8" | "utf8";
}

export interface SpawnSyncResult {
	status: number | null;
	stdout: string;
	stderr: string;
	error?: Error;
}

export type ChildProcessHandle = ChildProcess;

export function spawnProcess(command: string, args: string[], options: SpawnProcessOptions): ChildProcessHandle {
	const spawnEnv: Record<string, string> = {};
	if (options.env) {
		for (const envKey of Object.keys(options.env)) {
			const envValue = options.env[envKey];
			if (envValue !== undefined) spawnEnv[envKey] = envValue;
		}
	}
	const cwd = options.cwd === undefined ? process.cwd() : options.cwd;
	if (options.detached === true) {
		return nodeSpawn(command, args, {
			cwd,
			env: spawnEnv,
			detached: true,
			windowsHide: options.windowsHide === true,
			stdio: ["ignore", "pipe", "pipe"],
		});
	}
	return nodeSpawn(command, args, {
		cwd,
		env: spawnEnv,
		windowsHide: options.windowsHide === true,
		stdio: ["ignore", "pipe", "pipe"],
	});
}

export function spawnProcessSync(command: string, args: string[], options: SpawnSyncOptions): SpawnSyncResult {
	const result = nodeSpawnSync(command, args, {
		encoding: "utf8",
	});
	return {
		status: result.status,
		stdout: result.stdout as string,
		stderr: result.stderr as string,
		error: result.error,
	};
}

/**
 * Wait for a child process to terminate without hanging on inherited stdio handles.
 *
 * A short-lived child can `exit` while a detached descendant keeps its stdout/stderr
 * pipe open. We must not resolve on a fixed deadline measured from `exit`, or output
 * still being written past that deadline is silently lost (earendil-works/pi#5303).
 * After `exit` we wait for the pipes to fall idle: the grace timer is re-armed on
 * every chunk, so an actively writing descendant keeps us reading, while a quiet
 * inherited handle still releases us after the grace elapses.
 */
export function waitForChildProcess(child: ChildProcessHandle): Promise<number | null> {
	return new Promise((resolve, reject) => {
		let settled = false;
		let exited = false;
		let exitCode: number | null = null;
		let idleTimer: NodeJS.Timeout | undefined;
		let stdoutEnded = child.stdout === null;
		let stderrEnded = child.stderr === null;

		const finalize = (code: number | null) => {
			if (settled) return;
			settled = true;
			if (idleTimer) clearTimeout(idleTimer);
			resolve(code);
		};

		const maybeFinalizeAfterExit = () => {
			if (!exited || settled) return;
			if (stdoutEnded && stderrEnded) finalize(exitCode);
		};

		const armIdleTimer = () => {
			if (idleTimer) clearTimeout(idleTimer);
			idleTimer = setTimeout(() => finalize(exitCode), EXIT_STDIO_GRACE_MS);
		};

		const onData = () => {
			if (exited && !settled) armIdleTimer();
		};

		const onStdoutEnd = () => {
			stdoutEnded = true;
			maybeFinalizeAfterExit();
		};

		const onStderrEnd = () => {
			stderrEnded = true;
			maybeFinalizeAfterExit();
		};

		const onError = (err: Error) => {
			if (settled) return;
			settled = true;
			if (idleTimer) clearTimeout(idleTimer);
			reject(err);
		};

		const onExit = (code: number | null) => {
			exited = true;
			exitCode = code;
			maybeFinalizeAfterExit();
			if (!settled) armIdleTimer();
		};

		const stdout = child.stdout;
		const stderr = child.stderr;
		if (stdout) {
			stdout.on("data", onData);
			stdout.once("end", onStdoutEnd);
		}
		if (stderr) {
			stderr.on("data", onData);
			stderr.once("end", onStderrEnd);
		}
		child.on("error", onError);
		child.on("exit", onExit);
	});
}
