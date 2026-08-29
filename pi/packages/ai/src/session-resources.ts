export type SessionResourceCleanup = (sessionId?: string) => void;

class SessionCleanupError extends Error {
	errors: unknown[];

	constructor(errors: unknown[]) {
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
	const errors: unknown[] = [];
	for (const cleanup of sessionResourceCleanups) {
		try {
			cleanup(sessionId);
		} catch (error) {
			errors.push(error);
		}
	}
	if (errors.length > 0) {
		throw new SessionCleanupError(errors);
	}
}
