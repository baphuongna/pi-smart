import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeBudgetState, getSteeringMessage, shouldAutoCompact } from "../../src/budget/state-machine.ts";

describe("budget state machine", () => {
	it("returns NORMAL for <60%", () => {
		assert.equal(computeBudgetState(0.5, { frugal: 0.6, compact: 0.8, emergency: 0.9 }), "NORMAL");
	});

	it("returns FRUGAL at 60-80%", () => {
		assert.equal(computeBudgetState(0.65, { frugal: 0.6, compact: 0.8, emergency: 0.9 }), "FRUGAL");
	});

	it("returns COMPACT at 80-90%", () => {
		assert.equal(computeBudgetState(0.85, { frugal: 0.6, compact: 0.8, emergency: 0.9 }), "COMPACT");
	});

	it("returns EMERGENCY at >90%", () => {
		assert.equal(computeBudgetState(0.95, { frugal: 0.6, compact: 0.8, emergency: 0.9 }), "EMERGENCY");
	});

	it("returns null steering for NORMAL", () => {
		assert.equal(getSteeringMessage("NORMAL"), null);
	});

	it("returns steering message for FRUGAL", () => {
		assert.ok(getSteeringMessage("FRUGAL")!.includes("terse"));
	});

	it("returns steering message for EMERGENCY", () => {
		assert.ok(getSteeringMessage("EMERGENCY")!.includes("EMERGENCY"));
	});

	it("shouldAutoCompact for COMPACT and EMERGENCY", () => {
		assert.equal(shouldAutoCompact("NORMAL"), false);
		assert.equal(shouldAutoCompact("FRUGAL"), false);
		assert.equal(shouldAutoCompact("COMPACT"), true);
		assert.equal(shouldAutoCompact("EMERGENCY"), true);
	});
});
