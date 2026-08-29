import type { ModelsRefreshResult } from "../../../../ai/src/index.ts";
import type { ModelRuntime } from "../../core/model-runtime.ts";
import { raceWithAbortSignal } from "../../utils/abort.ts";

type ModelCatalogRuntime = Pick<ModelRuntime, "refresh">;

interface ActiveModelCatalogRefresh {
	controller: AbortController;
	promise: Promise<ModelsRefreshResult>;
	waiters: number;
}

class ModelCatalogRefreshCoordinator {
	private readonly activeByRuntime: { runtime: ModelCatalogRuntime; active: ActiveModelCatalogRefresh }[] = [];

	private findActive(runtime: ModelCatalogRuntime): ActiveModelCatalogRefresh | undefined {
		for (const item of this.activeByRuntime) {
			if (item.runtime === runtime) return item.active;
		}
		return undefined;
	}

	private removeActive(runtime: ModelCatalogRuntime): void {
		const index = this.activeByRuntime.findIndex((item) => item.runtime === runtime);
		if (index !== -1) this.activeByRuntime.splice(index, 1);
	}

	refresh(modelRuntime: ModelCatalogRuntime, signal: AbortSignal): Promise<ModelsRefreshResult> {
		signal.throwIfAborted();
		let active = this.findActive(modelRuntime);
		if (!active) {
			const controller = new AbortController();
			let created!: ActiveModelCatalogRefresh;
			const operation = modelRuntime.refresh({ signal: controller.signal });
			const promise = raceWithAbortSignal(operation, controller.signal).finally(() => {
				if (this.findActive(modelRuntime) === created) {
					this.removeActive(modelRuntime);
				}
			});
			created = { controller, promise, waiters: 0 };
			active = created;
			this.activeByRuntime.push({ runtime: modelRuntime, active });
		}

		active.waiters++;
		return raceWithAbortSignal(active.promise, signal).finally(() => {
			active.waiters--;
			if (active.waiters === 0 && this.findActive(modelRuntime) === active) {
				active.controller.abort();
			}
		});
	}
}

const modelCatalogRefreshCoordinator = new ModelCatalogRefreshCoordinator();

/** Share concurrent interactive all-catalog refreshes while keeping each caller's cancellation independent. */
export function refreshModelCatalogs(
	modelRuntime: ModelCatalogRuntime,
	signal: AbortSignal,
): Promise<ModelsRefreshResult> {
	return modelCatalogRefreshCoordinator.refresh(modelRuntime, signal);
}
