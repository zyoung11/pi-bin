/**
 * Probe: full session revive + buildSessionContext on real session files.
 * Build: scriptc build packages/coding-agent/src/probe-crash.ts --npm-static string_decoder
 */
import { loadEntriesFromFile, buildContextEntries, SessionManager, sessionEntryToContextMessages } from "./core/session-manager.ts";
import type { SessionEntry } from "./core/session-manager.ts";
import type { AgentMessage } from "../../agent/src/types.ts";

function recordViewOf(value: unknown): Record<string, unknown> {
	return value as Record<string, unknown>;
}

function entryIdOf(entry: unknown): string | undefined {
	const record = recordViewOf(entry);
	const id = record["id"];
	return typeof id === "string" ? id : undefined;
}

function runFile(path: string): void {
	console.log("===", path);
	const entries = loadEntriesFromFile(path);
	console.log("entries:", entries.length);
	const types: Record<string, number> = {};
	const nonHeader: SessionEntry[] = [];
	const byId: Map<string, SessionEntry> = new Map();
	for (const e of entries) {
		types[e.type] = (types[e.type] ?? 0) + 1;
		if (e.type !== "session") {
			nonHeader.push(e);
			const id = entryIdOf(e);
			if (id !== undefined) byId.set(id, e);
		}
	}
	console.log("types:", JSON.stringify(types));
	const ctx = buildContextEntries(nonHeader, undefined, byId);
	console.log("contextEntries:", ctx.length);
	let messageCount = 0;
	for (const entry of ctx) {
		const messages: AgentMessage[] = sessionEntryToContextMessages(entry);
		messageCount += messages.length;
	}
	console.log("messages:", messageCount);
}

export function main(): void {
	const simple = "/home/zy/.pi/agent/sessions/--home-zy-zy-TEST-pi-bin-pi--/2026-08-31T16-46-13-739Z_01a058b6-daeb-76be-9815-194177fd77e8.jsonl";
	runFile(simple);

	const complex = "/home/zy/.pi/agent/sessions/--home-zy-zy-TEST-pi-bin--/2026-08-26T15-12-46-033Z_01a03ea1-7dd0-738f-a346-4d33f52bede0.jsonl";
	runFile(complex);

	const sm = SessionManager.continueRecent("/home/zy/zy/TEST/pi-bin/pi");
	console.log("continueRecent:", sm.getSessionFile() !== undefined);
	const tree = sm.getTree();
	console.log("tree roots:", tree.length);
	const fullCtx = sm.buildSessionContext();
	console.log("full context messages:", fullCtx.messages.length, "model:", fullCtx.model === null ? "none" : fullCtx.model.modelId);
	console.log("ALL OK");
}

main();
