import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyPipeline, type Filter } from "../../src/filter/pipeline.ts";

describe("applyPipeline", () => {
	it("passes text through unchanged with no filters", () => {
		const { result, metrics } = applyPipeline("hello world", []);
		assert.equal(result, "hello world");
		assert.equal(metrics.filtersApplied, 0);
		assert.equal(metrics.reductionPct, 0);
	});

	it("applies a single filter", () => {
		const upper: Filter = {
			name: "uppercase",
			apply: (t) => t.toUpperCase(),
		};
		const { result, metrics } = applyPipeline("hello", [upper]);
		assert.equal(result, "HELLO");
		assert.equal(metrics.filtersApplied, 1);
	});

	it("applies multiple filters in order", () => {
		const addA: Filter = { name: "add-a", apply: (t) => t + "A" };
		const addB: Filter = { name: "add-b", apply: (t) => t + "B" };
		const { result } = applyPipeline("x", [addA, addB]);
		assert.equal(result, "xAB");
	});

	it("skips failing filters (safety passthrough)", () => {
		const bad: Filter = {
			name: "bad",
			apply: () => { throw new Error("boom"); },
		};
		const good: Filter = { name: "good", apply: (t) => t.toUpperCase() };
		const { result } = applyPipeline("hello", [bad, good]);
		assert.equal(result, "HELLO");
	});

	it("tracks metrics correctly", () => {
		const truncate: Filter = { name: "truncate", apply: (t) => t.slice(0, 5) };
		const { metrics } = applyPipeline("hello world this is long", [truncate]);
		assert.equal(metrics.bytesOut, 5);
		assert.ok(metrics.reductionPct > 0);
	});
});
