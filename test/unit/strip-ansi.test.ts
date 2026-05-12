import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createStripAnsiFilter } from "../../src/filter/filters/strip-ansi.ts";

describe("strip-ansi filter", () => {
	it("removes ANSI escape sequences", () => {
		const filter = createStripAnsiFilter();
		const input = "\x1b[32mgreen text\x1b[0m normal";
		assert.equal(filter.apply(input), "green text normal");
	});

	it("removes complex ANSI sequences", () => {
		const filter = createStripAnsiFilter();
		const input = "\x1b[1;31;47mbold red on white\x1b[0m";
		assert.equal(filter.apply(input), "bold red on white");
	});

	it("leaves plain text unchanged", () => {
		const filter = createStripAnsiFilter();
		assert.equal(filter.apply("plain text"), "plain text");
	});

	it("handles empty string", () => {
		const filter = createStripAnsiFilter();
		assert.equal(filter.apply(""), "");
	});
});
