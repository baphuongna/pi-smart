import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CostTracker } from "../../src/cost/tracker.ts";

describe("CostTracker", () => {
	it("tracks usage entries", () => {
		const tracker = new CostTracker();
		tracker.trackUsage("claude-sonnet-4", undefined, { inputTokens: 1000, outputTokens: 500 });
		const cost = tracker.getSessionCost(() => 1);
		assert.equal(cost.turns, 1);
		assert.equal(cost.totalInputTokens, 1000);
		assert.equal(cost.totalOutputTokens, 500);
	});

	it("aggregates by model", () => {
		const tracker = new CostTracker();
		tracker.trackUsage("model-a", undefined, { inputTokens: 100, outputTokens: 50 });
		tracker.trackUsage("model-a", undefined, { inputTokens: 200, outputTokens: 100 });
		tracker.trackUsage("model-b", undefined, { inputTokens: 300, outputTokens: 150 });

		const cost = tracker.getSessionCost((_model, usage) => (usage.inputTokens + usage.outputTokens) / 1000);
		assert.equal(cost.turns, 3);
		assert.equal(cost.byModel.get("model-a")!.turns, 2);
		assert.equal(cost.byModel.get("model-b")!.turns, 1);
	});

	it("tracks bytes filtered", () => {
		const tracker = new CostTracker();
		tracker.trackBytesFiltered(500);
		tracker.trackBytesFiltered(300);
		const cost = tracker.getSessionCost(() => 0);
		assert.equal(cost.savingsFromFiltering, 0); // No tokens to estimate against
	});

	it("reset clears all data", () => {
		const tracker = new CostTracker();
		tracker.trackUsage("model", undefined, { inputTokens: 100, outputTokens: 50 });
		tracker.reset();
		const cost = tracker.getSessionCost(() => 1);
		assert.equal(cost.turns, 0);
	});
});
