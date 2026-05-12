import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getIntensityForBudgetState, getOutputAllowanceMultiplier, validateIntensity } from "../../src/compress/intensity.ts";

describe("intensity", () => {
	it("returns terse for FRUGAL", () => {
		assert.equal(getIntensityForBudgetState("FRUGAL"), "terse");
	});

	it("returns terse for COMPACT", () => {
		assert.equal(getIntensityForBudgetState("COMPACT"), "terse");
	});

	it("returns normal for NORMAL", () => {
		assert.equal(getIntensityForBudgetState("NORMAL"), "normal");
	});

	it("output allowance decreases with budget pressure", () => {
		assert.equal(getOutputAllowanceMultiplier("NORMAL"), 1.0);
		assert.equal(getOutputAllowanceMultiplier("FRUGAL"), 0.5);
		assert.equal(getOutputAllowanceMultiplier("COMPACT"), 0.25);
		assert.equal(getOutputAllowanceMultiplier("EMERGENCY"), 0.1);
	});

	it("validates intensity values", () => {
		assert.equal(validateIntensity("terse"), "terse");
		assert.equal(validateIntensity("normal"), "normal");
		assert.equal(validateIntensity("verbose"), "verbose");
		assert.equal(validateIntensity("invalid"), null);
	});
});
