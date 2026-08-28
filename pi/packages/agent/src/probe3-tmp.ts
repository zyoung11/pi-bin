import type { SessionEntry } from "../../coding-agent/src/core/session-manager.ts";

class Holder {
	private byId: Map<string, SessionEntry> = new Map();

	getBranch(startId?: string): SessionEntry[] {
		const path: SessionEntry[] = [];
		let current = startId ? this.byId.get(startId) : undefined;
		while (current) {
			path.push(current);
			const parentId = (current as unknown as { parentId: string | null }).parentId;
			current = parentId ? this.byId.get(parentId) : undefined;
		}
		return path;
	}

	ids(): string[] {
		const out: string[] = [];
		for (const entry of this.byId.values()) {
			const entryId = (entry as unknown as { id: string }).id;
			out.push(entryId);
		}
		return out;
	}
}

export function q4(): Holder {
	return new Holder();
}
