import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createDedupLinesFilter } from "../../src/filter/filters/dedup-lines.ts";

describe("dedup-lines filter", () => {
	it("removes consecutive duplicate lines", () => {
		const filter = createDedupLinesFilter();
		const input = "aaa\naaa\naaa\nbbb\nbbb\nccc";
		assert.equal(filter.apply(input), "aaa\nbbb\nccc");
	});

	it("keeps non-consecutive duplicates", () => {
		const filter = createDedupLinesFilter();
		const input = "aaa\nbbb\naaa";
		assert.equal(filter.apply(input), "aaa\nbbb\naaa");
	});

	it("handles empty input", () => {
		const filter = createDedupLinesFilter();
		assert.equal(filter.apply(""), "");
	});

	it("handles single line", () => {
		const filter = createDedupLinesFilter();
		assert.equal(filter.apply("only line"), "only line");
	});
});
