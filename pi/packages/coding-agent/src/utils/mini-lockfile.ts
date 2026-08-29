/**
 * Minimal proper-lockfile replacement covering the API surface this codebase uses (lockSync/lock
 * with realpath/lockfilePath/stale/retries/onCompromised options and ELOCKED contention errors).
 * Locks are directories whose mtime file doubles as the staleness timestamp; only this program
 * reads them, so the on-disk format stays private.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";

export interface LockOptions {
	realpath?: boolean;
	lockfilePath?: string;
	stale?: number;
	retries?: number;
	onCompromised?: (err: Error) => void;
}

export class LockError extends Error {
	code: string;

	constructor(message: string) {
		super(message);
		this.name = "LockError";
		this.code = "ELOCKED";
	}
}

const DEFAULT_STALE_MS = 100_000;

function lockDirFor(path: string, options?: LockOptions): string {
	return options?.lockfilePath ?? `${path}.lock`;
}

function readLockTimestamp(lockDir: string): number | null {
	try {
		return Number(readFileSync(`${lockDir}/mtime`, "utf8").trim());
	} catch {
		return null;
	}
}

function stealStaleLock(lockDir: string, staleMs: number): boolean {
	try {
		const stats = statSync(lockDir);
		if (Date.now() - stats.mtimeMs < staleMs) return false;
	} catch {
		return false;
	}
	rmSync(lockDir, { recursive: true, force: true });
	try {
		mkdirSync(lockDir);
		writeFileSync(`${lockDir}/mtime`, String(Date.now()), "utf8");
		return true;
	} catch {
		return false;
	}
}

function acquireSync(lockDir: string, staleMs: number): void {
	if (!existsSync(lockDir)) {
		try {
			mkdirSync(lockDir);
			writeFileSync(`${lockDir}/mtime`, String(Date.now()), "utf8");
			return;
		} catch {
			existsSync(lockDir);
		}
	}
	if (staleMs > 0 && stealStaleLock(lockDir, staleMs)) return;
	if (staleMs > 0) {
		const created = readLockTimestamp(lockDir);
		if (created !== null && Date.now() - created > staleMs && stealStaleLock(lockDir, staleMs)) return;
	}
	throw new LockError(`lock "${lockDir}" is held by another process`);
}

class Lockfile {
	lockSync(path: string, options?: LockOptions): () => void {
		const lockDir = lockDirFor(path, options);
		acquireSync(lockDir, options?.stale ?? 0);
		return () => {
			rmSync(lockDir, { recursive: true, force: true });
		};
	}

	async lock(path: string, options?: LockOptions): Promise<() => Promise<void>> {
		const lockDir = lockDirFor(path, options);
		const staleMs = options?.stale ?? DEFAULT_STALE_MS;
		acquireSync(lockDir, staleMs);
		return async () => {
			rmSync(lockDir, { recursive: true, force: true });
		};
	}
}

const lockfile = new Lockfile();

export default lockfile;
