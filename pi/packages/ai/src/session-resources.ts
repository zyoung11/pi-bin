export type SessionResourceCleanup = (sessionId?: string) => void;

class SessionCleanupError extends Error {
	errors: string[];

	constructor(errors: string[]) {
		super("Failed to cleanup session resources");
		this.name = "SessionCleanupError";
		this.errors = errors;
	}
}

const sessionResourceCleanups: SessionResourceCleanup[] = [];

export function registerSessionResourceCleanup(cleanup: SessionResourceCleanup): () => void {
	sessionResourceCleanups.push(cleanup);
	return () => {
		const index = sessionResourceCleanups.indexOf(cleanup);
		if (index !== -1) sessionResourceCleanups.splice(index, 1);
	};
}

export function cleanupSessionResources(sessionId?: string): void {
	const errors: string[] = [];
	for (const cleanup of sessionResourceCleanups) {
		try {
			cleanup(sessionId);
		} catch (error) {
			errors.push(error instanceof Error ? error.message : JSON.stringify(error));
		}
	}
	if (errors.length > 0) {
		throw new SessionCleanupError(errors);
	}
}
