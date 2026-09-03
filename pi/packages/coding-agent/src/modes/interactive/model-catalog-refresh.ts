import type { ModelsRefreshResult } from "../../../../ai/src/index.ts";
import type { ModelRuntime } from "../../core/model-runtime.ts";
import { abortReason } from "../../utils/abort.ts";

interface ActiveModelCatalogRefresh {
	controller: AbortController;
	promise: Promise<ModelsRefreshResult>;
	waiters: number;
}

/** Concrete-typed race with abort (the generic helper's Promise<unknown> slots reject
 * ModelsRefreshResult's Map-bearing record; a local concrete executor lowers cleanly). */
function raceRefreshWithAbort(
	operation: Promise<ModelsRefreshResult>,
	signal: AbortSignal,
): Promise<ModelsRefreshResult> {
	if (signal.aborted) {
		void operation.catch(() => {});
		return Promise.reject(abortReason(signal));
	}
	return new Promise<ModelsRefreshResult>((resolve, reject) => {
		let settled = false;
		const cleanup = () => signal.removeEventListener("abort", onAbort);
		const onAbort = () => {
			if (settled) return;
			settled = true;
			cleanup();
			reject(abortReason(signal));
		};
		signal.addEventListener("abort", onAbort, { once: true });
		void operation
			.then((value) => {
				if (settled) return;
				settled = true;
				cleanup();
				resolve(value);
			})
			.catch((error: unknown) => {
				if (settled) return;
				settled = true;
				cleanup();
				reject(error);
			});
		if (signal.aborted) onAbort();
	});
}

class ModelCatalogRefreshCoordinator {
	private readonly activeByRuntime: { runtime: ModelRuntime; active: ActiveModelCatalogRefresh }[] = [];

	private findActive(runtime: ModelRuntime): ActiveModelCatalogRefresh | undefined {
		for (const item of this.activeByRuntime) {
			if (item.runtime === runtime) return item.active;
		}
		return undefined;
	}

	private removeActive(runtime: ModelRuntime): void {
		const index = this.activeByRuntime.findIndex((item) => item.runtime === runtime);
		if (index !== -1) this.activeByRuntime.splice(index, 1);
	}

	refresh(modelRuntime: ModelRuntime, signal: AbortSignal): Promise<ModelsRefreshResult> {
		signal.throwIfAborted();
		let active = this.findActive(modelRuntime);
		if (!active) {
			const controller = new AbortController();
			let created!: ActiveModelCatalogRefresh;
			const operation = modelRuntime.refresh({ signal: controller.signal });
			const promise = raceRefreshWithAbort(operation, controller.signal).finally(() => {
				if (this.findActive(modelRuntime) === created) {
					this.removeActive(modelRuntime);
				}
			});
			created = { controller, promise, waiters: 0 };
			active = created;
			this.activeByRuntime.push({ runtime: modelRuntime, active });
		}

		active.waiters++;
		return raceRefreshWithAbort(active.promise, signal).finally(() => {
			active.waiters--;
			if (active.waiters === 0 && this.findActive(modelRuntime) === active) {
				active.controller.abort();
			}
		});
	}
}

const modelCatalogRefreshCoordinator = new ModelCatalogRefreshCoordinator();

/** Share concurrent interactive all-catalog refreshes while keeping each caller's cancellation independent. */
export function refreshModelCatalogs(modelRuntime: ModelRuntime, signal: AbortSignal): Promise<ModelsRefreshResult> {
	return modelCatalogRefreshCoordinator.refresh(modelRuntime, signal);
}
