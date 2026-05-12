import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculatePercentage, getContextUsage } from "../../src/budget/tracker.ts";

describe("budget tracker", () => {
	it("calculates percentage correctly", () => {
		assert.equal(calculatePercentage(50, 100), 0.5);
		assert.equal(calculatePercentage(0, 100), 0);
		assert.equal(calculatePercentage(100, 100), 1);
	});

	it("handles zero total", () => {
		assert.equal(calculatePercentage(50, 0), 0);
	});

	it("parses context usage from Pi API", () => {
		const result = getContextUsage({ tokens: 50000 });
		assert.ok(result);
		assert.equal(result!.usedTokens, 50000);
	});

	it("returns null for null/undefined", () => {
		assert.equal(getContextUsage(null), null);
		assert.equal(getContextUsage(undefined), null);
	});

	it("returns null for null tokens", () => {
		assert.equal(getContextUsage({ tokens: null }), null);
	});
});
