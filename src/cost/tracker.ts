export interface Usage {
	inputTokens: number;
	outputTokens: number;
	cacheReadTokens?: number;
	cacheWriteTokens?: number;
}

export interface ModelUsage {
	model: string;
	provider?: string;
	usage: Usage;
	timestamp: number;
}

export interface SessionCost {
	totalCost: number;
	turns: number;
	totalInputTokens: number;
	totalOutputTokens: number;
	byModel: Map<string, { cost: number; turns: number; inputTokens: number; outputTokens: number }>;
	savingsFromFiltering: number;
}

export class CostTracker {
	private entries: ModelUsage[] = [];
	private bytesFiltered: number = 0;

	trackUsage(model: string, provider: string | undefined, usage: Usage): void {
		this.entries.push({
			model,
			provider,
			usage,
			timestamp: Date.now(),
		});
	}

	trackBytesFiltered(bytesSaved: number): void {
		this.bytesFiltered += bytesSaved;
	}

	getSessionCost(pricingFn: (model: string, usage: Usage) => number): SessionCost {
		let totalCost = 0;
		let totalInputTokens = 0;
		let totalOutputTokens = 0;
		const byModel = new Map<string, { cost: number; turns: number; inputTokens: number; outputTokens: number }>();

		for (const entry of this.entries) {
			const cost = pricingFn(entry.model, entry.usage);
			totalCost += cost;
			totalInputTokens += entry.usage.inputTokens;
			totalOutputTokens += entry.usage.outputTokens;

			const existing = byModel.get(entry.model);
			if (existing) {
				existing.cost += cost;
				existing.turns++;
				existing.inputTokens += entry.usage.inputTokens;
				existing.outputTokens += entry.usage.outputTokens;
			} else {
				byModel.set(entry.model, {
					cost,
					turns: 1,
					inputTokens: entry.usage.inputTokens,
					outputTokens: entry.usage.outputTokens,
				});
			}
		}

		// Estimate savings: bytes filtered / ~4 bytes per token * average cost per token
		const avgCostPerToken = this.entries.length > 0 ? totalCost / (totalInputTokens + totalOutputTokens || 1) : 0;
		const estimatedTokensSaved = Math.floor(this.bytesFiltered / 4);
		const savingsFromFiltering = estimatedTokensSaved * avgCostPerToken;

		return {
			totalCost,
			turns: this.entries.length,
			totalInputTokens,
			totalOutputTokens,
			byModel,
			savingsFromFiltering,
		};
	}

	reset(): void {
		this.entries = [];
		this.bytesFiltered = 0;
	}
}
