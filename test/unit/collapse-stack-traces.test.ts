import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCollapseStackTracesFilter } from "../../src/filter/filters/collapse-stack-traces.ts";

describe("collapse-stack-traces filter", () => {
	it("collapses long stack traces", () => {
		const filter = createCollapseStackTracesFilter();
		const frames = Array.from({ length: 15 }, (_, i) => `    at func${i} (file${i}.ts:${i}:1)`);
		const input = ["Error: something went wrong", ...frames].join("\n");
		const result = filter.apply(input);
		assert.ok(result.includes("Error: something went wrong"));
		assert.ok(result.includes("frames omitted"));
		assert.ok(result.includes("at func0"));
		assert.ok(result.includes("at func14"));
	});

	it("keeps short stack traces unchanged", () => {
		const filter = createCollapseStackTracesFilter();
		const input = "Error: bad\n    at func1 (file1.ts:1:1)\n    at func2 (file2.ts:2:2)";
		const result = filter.apply(input);
		assert.equal(result, input);
	});

	it("handles text without stack traces", () => {
		const filter = createCollapseStackTracesFilter();
		assert.equal(filter.apply("just text"), "just text");
	});
});
