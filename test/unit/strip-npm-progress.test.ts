import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createStripNpmProgressFilter } from "../../src/filter/filters/strip-npm-progress.ts";

describe("strip-npm-progress filter", () => {
	it("removes spinner lines", () => {
		const filter = createStripNpmProgressFilter();
		const input = "⠼ Building...\nreal output\n⠴ Building more...";
		const result = filter.apply(input);
		assert.ok(result.includes("real output"));
		assert.ok(!result.includes("⠼"));
	});

	it("keeps normal output", () => {
		const filter = createStripNpmProgressFilter();
		const input = "added 5 packages\nreal output";
		const result = filter.apply(input);
		assert.ok(result.includes("real output"));
	});
});
