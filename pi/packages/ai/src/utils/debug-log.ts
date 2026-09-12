import { appendFileSync } from "node:fs";

/**
 * PI_DEBUG_URJ=1 gated file logger for abort-path and unhandled-rejection
 * probes. Writes to a file instead of stderr: in the interactive TUI, stderr
 * output corrupts the frame (stderr and stdout share the terminal).
 *
 * Log file: /tmp/pi-debug-urj.log — `tail -f` it while reproducing.
 */
const ENABLED = process.env.PI_DEBUG_URJ === "1";
const LOG_PATH = "/tmp/pi-debug-urj.log";

export function debugLog(line: string): void {
	if (!ENABLED) return;
	try {
		appendFileSync(LOG_PATH, `${line}\n`);
	} catch {
		// ignore file errors in a debug logger
	}
}
