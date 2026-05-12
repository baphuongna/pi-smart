import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createStripTimestampsFilter } from "../../src/filter/filters/strip-timestamps.ts";

describe("strip-timestamps filter", () => {
	it("removes ISO timestamps at line start", () => {
		const filter = createStripTimestampsFilter();
		const input = "2024-01-15T10:30:00.000Z some log message";
		assert.equal(filter.apply(input), "some log message");
	});

	it("removes space-separated timestamps", () => {
		const filter = createStripTimestampsFilter();
		const input = "2024-01-15 10:30:00 some log message";
		assert.equal(filter.apply(input), "some log message");
	});

	it("leaves text without timestamps unchanged", () => {
		const filter = createStripTimestampsFilter();
		assert.equal(filter.apply("no timestamps here"), "no timestamps here");
	});

	it("handles multiple lines", () => {
		const filter = createStripTimestampsFilter();
		const input = "2024-01-15T10:30:00 line1\n2024-01-15T10:30:01 line2";
		assert.equal(filter.apply(input), "line1\nline2");
	});
});
