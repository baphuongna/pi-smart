import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHeadTailFilter } from "../../src/filter/filters/head-tail.ts";

describe("head-tail filter", () => {
	it("truncates long output", () => {
		const filter = createHeadTailFilter(3);
		const lines = Array.from({ length: 20 }, (_, i) => `line ${i}`);
		const input = lines.join("\n");
		const result = filter.apply(input);
		assert.ok(result.includes("line 0"));
		assert.ok(result.includes("line 19"));
		assert.ok(result.includes("lines truncated"));
	});

	it("does not truncate short output", () => {
		const filter = createHeadTailFilter(100);
		assert.equal(filter.apply("short"), "short");
	});

	it("respects custom limit", () => {
		const filter = createHeadTailFilter(2);
		const lines = Array.from({ length: 10 }, (_, i) => `line ${i}`);
		const result = filter.apply(lines.join("\n"));
		const resultLines = result.split("\n");
		// Should have: 2 head + 1 marker + 2 tail = 5
		assert.equal(resultLines.length, 5);
	});

	it("uses default 100 lines when no arg", () => {
		const filter = createHeadTailFilter();
		const lines = Array.from({ length: 250 }, (_, i) => `line ${i}`);
		const result = filter.apply(lines.join("\n"));
		assert.ok(result.includes("line 0"));
		assert.ok(result.includes("line 249"));
	});
});
