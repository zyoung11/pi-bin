import { readdirSync, readFileSync, statSync } from "node:fs";

export const FS_WATCH_RETRY_DELAY_MS = 5000;

const FS_WATCH_POLL_INTERVAL_MS = 1000;

/** Polling stand-in for `fs.FSWatcher` (fs.watch has no scriptc lowering). */
export interface FsPollWatcher {
	close(): void;
}

export function closeWatcher(watcher: FsPollWatcher | null | undefined): void {
	if (!watcher) {
		return;
	}

	try {
		watcher.close();
	} catch {
		// Ignore watcher close errors
	}
}

function isDirectoryPath(path: string): boolean {
	try {
		return statSync(path).isDirectory();
	} catch {
		return false;
	}
}

function snapshotFile(path: string): string | undefined {
	try {
		return readFileSync(path, "utf8");
	} catch {
		return undefined;
	}
}

function snapshotDirectory(path: string): string | undefined {
	try {
		return readdirSync(path).sort().join("\n");
	} catch {
		return undefined;
	}
}

/**
 * Poll `path` for changes (file content or directory listing snapshot) and
 * invoke `listener("change", null)` when the snapshot differs. Directory
 * watching sees entry add/remove/rename but not in-place content edits of
 * entries; poll a specific file when content accuracy matters.
 */
export function watchWithErrorHandler(
	path: string,
	listener: (eventType: string, filename: string | null) => void,
	onError: () => void,
): FsPollWatcher | null {
	try {
		const isDir = isDirectoryPath(path);
		const snapshot = (): string | undefined => (isDir ? snapshotDirectory(path) : snapshotFile(path));
		let last = snapshot();
		const timer = setInterval(() => {
			const current = snapshot();
			if (current !== last) {
				last = current;
				listener("change", null);
			}
		}, FS_WATCH_POLL_INTERVAL_MS);
		return {
			close() {
				clearInterval(timer);
			},
		};
	} catch {
		onError();
		return null;
	}
}
