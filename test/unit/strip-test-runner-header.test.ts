import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createStripTestRunnerHeaderFilter } from "../../src/filter/filters/strip-test-runner-header.ts";

describe("strip-test-runner-header filter", () => {
	it("removes test runner preamble", () => {
		const filter = createStripTestRunnerHeaderFilter();
		const input = "Running 5 tests...\n✓ test 1 passed\nTest suite started\n✓ test 2 passed";
		const result = filter.apply(input);
		assert.ok(!result.includes("Running 5 tests"));
		assert.ok(result.includes("test 1 passed"));
	});

	it("keeps actual test results", () => {
		const filter = createStripTestRunnerHeaderFilter();
		const input = "PASS src/test1.ts\nFAIL src/test2.ts\n5 passing, 1 failing";
		const result = filter.apply(input);
		assert.ok(result.includes("PASS"));
		assert.ok(result.includes("FAIL"));
	});
});
