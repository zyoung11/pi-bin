import { uuidv7 } from "../../../../ai/src/index.ts";
import type { AgentMessage } from "../../types.ts";
import type {
	BranchBounds,
	Entry,
	EntryQuery,
	IdGenerator,
	LanePointer,
	LaneRecord,
	LogItem,
	LogOptions,
	NewRecord,
	OperationStartedRecord,
	ProvisionedEntry,
	RecordBase,
	RecordQuery,
	SessionMetadata,
	SessionStats,
	SessionStorage,
	SessionTree,
} from "./types.ts";
import { SessionError } from "./types.ts";

const MAX_JSON_DEPTH = 512;

function invalidPayload(reason: string): never {
	throw new SessionError("invalid_payload", `Durable payload ${reason}`);
}

function assertValidLimit(limit: number | undefined): void {
	if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
		throw new SessionError("invalid_query", "limit must be a positive integer");
	}
}

function assertValidCursor(afterSeq: number | undefined): void {
	if (afterSeq !== undefined && (!Number.isInteger(afterSeq) || afterSeq < 0)) {
		throw new SessionError("invalid_query", "cursor sequence must be a non-negative integer");
	}
}

export function assertJsonSerializable(value: unknown): void {
	assertJsonSerializableDepth(value, 0);
}

function assertJsonSerializableDepth(value: unknown, depth: number): void {
	if (depth > MAX_JSON_DEPTH) invalidPayload("exceeds maximum depth");
	if (value === null || typeof value === "string" || typeof value === "boolean") {
		return;
	}
	if (typeof value === "number") {
		if (!Number.isFinite(value)) invalidPayload("contains a non-finite number");
		return;
	}
	if (typeof value !== "object") invalidPayload(`contains ${typeof value}`);
	if (Array.isArray(value)) {
		const items = value as unknown as unknown[];
		for (let index = 0; index < items.length; index++) {
			assertJsonSerializableDepth(items[index], depth + 1);
		}
		return;
	}
	const record = value as unknown as Record<string, unknown>;
	const keys = Object.keys(record);
	for (let index = 0; index < keys.length; index++) {
		assertJsonSerializableDepth(record[keys[index]!], depth + 1);
	}
}

export class Session<TMetadata extends SessionMetadata = SessionMetadata> implements SessionTree {
	private readonly storage: SessionStorage<TMetadata>;
	readonly idGenerator: IdGenerator;

	constructor(storage: SessionStorage<TMetadata>, options: { idGenerator?: IdGenerator } = {}) {
		this.storage = storage;
		this.idGenerator = options.idGenerator ?? { next: () => uuidv7() };
	}

	async getMetadata(): Promise<TMetadata> {
		return this.storage.getMetadata();
	}

	view(lane: string): SessionTree {
		return {
			getLeafId: () => this.getLeafIdForLane(lane),
			getEntry: (id) => this.getEntry(id),
			getStats: () => this.getStats(),
			getName: () => this.getName(),
			setName: (name) => this.setName(name),
			getLabel: (targetId) => this.getLabel(targetId),
			setLabel: (targetId, label) => this.setLabel(targetId, label),
			findEntries: (query) => this.queryEntries(query),
			findEntry: async (query = {}) => (await this.queryEntries(query, 1))[0],
			findEntriesOnBranch: (query) => this.queryBranchEntries(lane, query),
			findEntryOnBranch: async (query = {}) => (await this.queryBranchEntries(lane, query, 1))[0],
			appendMessage: (message) => this.appendMessageToLane(lane, message),
			appendCustomEntry: (customType, data) => this.appendCustomEntryToLane(lane, customType, data),
		};
	}

	async getLeafId(): Promise<string | null> {
		return this.getLeafIdForLane("main");
	}

	async getEntry(id: string): Promise<Entry | undefined> {
		return this.storage.getEntry(id);
	}

	async getStats(): Promise<SessionStats> {
		return this.storage.getStats();
	}

	async getName(): Promise<string | undefined> {
		return this.storage.getName();
	}

	async setName(name: string | undefined): Promise<void> {
		await this.storage.setName(name);
	}

	async getLabel(targetId: string): Promise<string | undefined> {
		return this.storage.getLabel(targetId);
	}

	async setLabel(targetId: string, label: string | undefined): Promise<void> {
		await this.storage.setLabel(targetId, label);
	}

	async findEntries(query?: EntryQuery): Promise<Entry[]> {
		return this.queryEntries(query);
	}

	async findEntry(query: EntryQuery = {}): Promise<Entry | undefined> {
		return (await this.queryEntries(query, 1))[0];
	}

	async findEntriesOnBranch(query?: EntryQuery & BranchBounds): Promise<Entry[]> {
		return this.queryBranchEntries("main", query);
	}

	async findEntryOnBranch(query: EntryQuery & BranchBounds = {}): Promise<Entry | undefined> {
		return (await this.queryBranchEntries("main", query, 1))[0];
	}

	async appendMessage(message: AgentMessage): Promise<string> {
		return this.appendMessageToLane("main", message);
	}

	async appendCustomEntry(customType: string, data?: unknown): Promise<string> {
		return this.appendCustomEntryToLane("main", customType, data);
	}

	async getLanes(): Promise<LanePointer[]> {
		return this.storage.getLanes();
	}

	async createLane(lane: string, at: string | null): Promise<void> {
		await this.storage.createLane(lane, at);
	}

	async moveLane(lane: string, to: string | null): Promise<void> {
		await this.storage.moveLane(lane, to);
	}

	async appendEntry(entry: ProvisionedEntry, lane: string): Promise<Entry> {
		return this.commitEntry(entry, lane);
	}

	async appendRecord<TNewRecord extends NewRecord>(
		record: TNewRecord,
	): Promise<TNewRecord & Pick<RecordBase, "seq" | "timestamp">>;
	async appendRecord(record: NewRecord): Promise<LaneRecord> {
		return this.commitRecord(record);
	}

	async findRecords(query?: RecordQuery): Promise<LaneRecord[]>;
	async findRecords(query?: RecordQuery): Promise<LaneRecord[]> {
		return this.queryRecords(query);
	}

	async findOpenOperations(lane: string, options?: { limit?: number }): Promise<OperationStartedRecord[]> {
		assertValidLimit(options?.limit);
		return this.storage.findOpenOperations(lane, options);
	}

	async getLog(options?: LogOptions): Promise<LogItem[]> {
		return this.queryLog(options);
	}

	/** Returns the lane's current leaf, or null when empty. Throws when the lane does not exist. */
	private async getLeafIdForLane(lane: string): Promise<string | null> {
		const pointer = (await this.getLanes()).find((candidate) => candidate.lane === lane);
		if (!pointer) throw new SessionError("invalid_lane", `Lane not found: ${lane}`);
		return pointer.leafId;
	}

	private async queryEntries(query: EntryQuery = {}, resultLimit = query.limit): Promise<Entry[]> {
		assertValidLimit(query.limit);
		assertValidCursor(query.cursor?.afterSeq);
		return this.storage.findEntries(resultLimit === query.limit ? query : { ...query, limit: resultLimit });
	}

	/**
	 * Queries from `query.start` toward the root, defaulting to the lane's current leaf.
	 * `resultLimit` lets single-entry queries cap results without changing the caller's query.
	 */
	private async queryBranchEntries(
		defaultLane: string,
		query: EntryQuery & BranchBounds = {},
		resultLimit = query.limit,
	): Promise<Entry[]> {
		assertValidLimit(query.limit);
		assertValidCursor(query.cursor?.afterSeq);
		let start: string | null;
		if (query.start !== undefined) {
			start = query.start;
		} else {
			start = await this.getLeafIdForLane(defaultLane);
		}
		if (start === null) {
			const empty: Entry[] = [];
			return empty;
		}
		const storageQuery = resultLimit === query.limit ? query : { ...query, limit: resultLimit };
		return this.storage.findEntriesOnBranch({ ...storageQuery, start });
	}

	private async queryRecords(query: RecordQuery = {}): Promise<LaneRecord[]> {
		assertValidLimit(query.limit);
		assertValidCursor(query.afterSeq);
		if (query.operationKind !== undefined && query.type !== "operation_started") {
			throw new SessionError("invalid_query", 'operationKind requires type "operation_started"');
		}
		return this.storage.findRecords(query);
	}

	private async queryLog(options: LogOptions = {}): Promise<LogItem[]> {
		assertValidLimit(options.limit);
		assertValidCursor(options.afterSeq);
		return this.storage.getLog(options);
	}

	private async appendMessageToLane(lane: string, message: AgentMessage): Promise<string> {
		const entry = await this.commitEntry({ type: "message", id: this.idGenerator.next(), message }, lane);
		return entry.id;
	}

	private async appendCustomEntryToLane(lane: string, customType: string, data?: unknown): Promise<string> {
		const entry = await this.commitEntry(
			data === undefined
				? { type: "custom", id: this.idGenerator.next(), customType }
				: { type: "custom", id: this.idGenerator.next(), customType, data },
			lane,
		);
		return entry.id;
	}

	private async commitEntry(entry: ProvisionedEntry, lane: string): Promise<Entry> {
		assertJsonSerializable(entry);
		return this.storage.appendEntry(entry, lane);
	}

	private async commitRecord(record: NewRecord): Promise<LaneRecord> {
		assertJsonSerializable(record);
		return this.storage.appendRecord(record);
	}
}
