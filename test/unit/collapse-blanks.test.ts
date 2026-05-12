import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCollapseBlanksFilter } from "../../src/filter/filters/collapse-blanks.ts";

describe("collapse-blanks filter", () => {
	it("collapses 3+ blank lines to 2", () => {
		const filter = createCollapseBlanksFilter();
		const input = "line1\n\n\n\nline2";
		assert.equal(filter.apply(input), "line1\n\nline2");
	});

	it("leaves 2 blank lines (1 empty line) unchanged", () => {
		const filter = createCollapseBlanksFilter();
		const input = "line1\n\nline2";
		assert.equal(filter.apply(input), "line1\n\nline2");
	});

	it("leaves single blank line unchanged", () => {
		const filter = createCollapseBlanksFilter();
		const input = "line1\nline2";
		assert.equal(filter.apply(input), "line1\nline2");
	});

	it("handles trailing blank lines", () => {
		const filter = createCollapseBlanksFilter();
		const input = "line1\n\n\n\n";
		assert.equal(filter.apply(input), "line1\n\n");
	});
});
