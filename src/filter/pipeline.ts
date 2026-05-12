export interface Filter {
	name: string;
	apply(text: string): string;
}

export interface PipelineMetrics {
	bytesIn: number;
	bytesOut: number;
	reductionPct: number;
	filtersApplied: number;
}

export function applyPipeline(text: string, filters: Filter[]): { result: string; metrics: PipelineMetrics } {
	const bytesIn = Buffer.byteLength(text, "utf-8");
	let result = text;
	let filtersApplied = 0;

	for (const filter of filters) {
		try {
			const before = result;
			result = filter.apply(result);
			if (result !== before) filtersApplied++;
		} catch (error: unknown) {
			// SAFETY: If filter fails, skip it (rtk fallback pattern)
			console.error(`[pi-smart] filter "${filter.name}" error: ${error instanceof Error ? error.message : String(error)}`);
			continue;
		}
	}

	const bytesOut = Buffer.byteLength(result, "utf-8");
	const reductionPct = bytesIn > 0 ? Math.round(((bytesIn - bytesOut) / bytesIn) * 100) : 0;

	return {
		result,
		metrics: { bytesIn, bytesOut, reductionPct, filtersApplied },
	};
}
