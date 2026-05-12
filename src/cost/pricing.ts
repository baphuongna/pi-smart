import type { Usage } from "./tracker.ts";

export interface ModelPricing {
	model: string;
	inputPerMillion: number;
	outputPerMillion: number;
	cacheReadPerMillion?: number;
	cacheWritePerMillion?: number;
}

const BUILTIN_PRICING: ModelPricing[] = [
	{ model: "claude-sonnet-4", inputPerMillion: 3, outputPerMillion: 15 },
	{ model: "claude-opus-4", inputPerMillion: 15, outputPerMillion: 75 },
	{ model: "claude-haiku-3.5", inputPerMillion: 0.8, outputPerMillion: 4 },
	{ model: "gpt-4.1", inputPerMillion: 2, outputPerMillion: 8 },
	{ model: "gpt-4o", inputPerMillion: 2.5, outputPerMillion: 10 },
	{ model: "gpt-4o-mini", inputPerMillion: 0.15, outputPerMillion: 0.6 },
	{ model: "gemini-2.5-pro", inputPerMillion: 1.25, outputPerMillion: 10 },
	{ model: "gemini-2.5-flash", inputPerMillion: 0.15, outputPerMillion: 0.6 },
];

export class PricingDatabase {
	private pricing: ModelPricing[];

	constructor(customPricing?: Record<string, { inputPerMillion?: number; outputPerMillion?: number; cacheReadPerMillion?: number; cacheWritePerMillion?: number }>) {
		this.pricing = [...BUILTIN_PRICING];

		// Merge custom pricing
		if (customPricing) {
			for (const [model, rates] of Object.entries(customPricing)) {
				if (rates.inputPerMillion !== undefined && rates.outputPerMillion !== undefined) {
					this.pricing.push({
						model,
						inputPerMillion: rates.inputPerMillion,
						outputPerMillion: rates.outputPerMillion,
						cacheReadPerMillion: rates.cacheReadPerMillion,
						cacheWritePerMillion: rates.cacheWritePerMillion,
					});
				}
			}
		}
	}

	findPricing(model: string): ModelPricing | null {
		// Exact match first
		const exact = this.pricing.find((p) => p.model === model);
		if (exact) return exact;

		// Prefix match (handles versioned models like "claude-sonnet-4-20250514")
		for (const p of this.pricing) {
			if (model.startsWith(p.model)) return p;
		}

		return null;
	}

	calculateCost(model: string, usage: Usage): number {
		const pricing = this.findPricing(model);
		if (!pricing) return 0;

		const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPerMillion;
		const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputPerMillion;
		const cacheReadCost = usage.cacheReadTokens ? (usage.cacheReadTokens / 1_000_000) * (pricing.cacheReadPerMillion ?? pricing.inputPerMillion * 0.1) : 0;
		const cacheWriteCost = usage.cacheWriteTokens ? (usage.cacheWriteTokens / 1_000_000) * (pricing.cacheWritePerMillion ?? pricing.inputPerMillion * 1.25) : 0;

		return inputCost + outputCost + cacheReadCost + cacheWriteCost;
	}
}
