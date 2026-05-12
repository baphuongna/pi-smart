import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PricingDatabase } from "../../src/cost/pricing.ts";

describe("PricingDatabase", () => {
	it("finds exact model match", () => {
		const db = new PricingDatabase();
		const pricing = db.findPricing("claude-sonnet-4");
		assert.ok(pricing);
		assert.equal(pricing!.inputPerMillion, 3);
		assert.equal(pricing!.outputPerMillion, 15);
	});

	it("finds prefix match for versioned models", () => {
		const db = new PricingDatabase();
		const pricing = db.findPricing("claude-sonnet-4-20250514");
		assert.ok(pricing);
		assert.equal(pricing!.inputPerMillion, 3);
	});

	it("returns null for unknown model", () => {
		const db = new PricingDatabase();
		assert.equal(db.findPricing("unknown-model-xyz"), null);
	});

	it("merges custom pricing", () => {
		const db = new PricingDatabase({
			"my-custom-model": { inputPerMillion: 5, outputPerMillion: 25 },
		});
		const pricing = db.findPricing("my-custom-model");
		assert.ok(pricing);
		assert.equal(pricing!.inputPerMillion, 5);
	});

	it("calculates cost correctly", () => {
		const db = new PricingDatabase();
		const cost = db.calculateCost("claude-sonnet-4", {
			inputTokens: 1_000_000,
			outputTokens: 1_000_000,
		});
		assert.equal(cost, 3 + 15); // $3 input + $15 output per million
	});

	it("calculates cache token costs", () => {
		const db = new PricingDatabase();
		const cost = db.calculateCost("claude-sonnet-4", {
			inputTokens: 1000,
			outputTokens: 1000,
			cacheReadTokens: 1_000_000,
		});
		assert.ok(cost > 0);
	});
});
