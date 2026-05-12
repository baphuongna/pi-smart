import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatWidgetData, formatWidgetString, formatDetailedCost } from "../../src/cost/widget.ts";
import type { SessionCost } from "../../src/cost/tracker.ts";

describe("cost widget", () => {
	it("formats widget data", () => {
		const data = formatWidgetData(
			{ totalCost: 0.42, turns: 5, totalInputTokens: 100000, totalOutputTokens: 8000, byModel: new Map(), savingsFromFiltering: 0.05 } as SessionCost,
			"normal",
			50000,
			100000,
		);
		assert.equal(data.totalCost, "$0.42");
		assert.ok(data.totalTokens.includes("K"));
		assert.equal(data.intensity, "normal");
	});

	it("formats widget string", () => {
		const data = { totalCost: "$0.42", totalTokens: "108.0K tok", savingsPct: "50%", intensity: "terse" };
		const str = formatWidgetString(data);
		assert.ok(str.includes("$0.42"));
		assert.ok(str.includes("terse"));
	});

	it("formats detailed cost breakdown", () => {
		const sessionCost: SessionCost = {
			totalCost: 0.5,
			turns: 3,
			totalInputTokens: 50000,
			totalOutputTokens: 5000,
			byModel: new Map([
				["claude-sonnet-4", { cost: 0.4, turns: 2, inputTokens: 40000, outputTokens: 4000 }],
				["gpt-4.1", { cost: 0.1, turns: 1, inputTokens: 10000, outputTokens: 1000 }],
			]),
			savingsFromFiltering: 0.05,
		};
		const detailed = formatDetailedCost(sessionCost);
		assert.ok(detailed.includes("$0.5000"));
		assert.ok(detailed.includes("claude-sonnet-4"));
		assert.ok(detailed.includes("gpt-4.1"));
	});
});
