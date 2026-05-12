import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCustomRegexFilter } from "../../src/filter/filters/custom-regex.ts";

describe("custom-regex filter", () => {
	it("applies regex replacement", () => {
		const config = JSON.stringify({ pattern: "foo", replacement: "bar" });
		const filter = createCustomRegexFilter(config);
		assert.equal(filter.apply("foo baz foo"), "bar baz bar");
	});

	it("passes through when no config", () => {
		const filter = createCustomRegexFilter();
		assert.equal(filter.apply("unchanged"), "unchanged");
	});

	it("handles invalid JSON gracefully", () => {
		const filter = createCustomRegexFilter("not-json");
		assert.equal(filter.apply("unchanged"), "unchanged");
	});

	it("handles invalid regex gracefully", () => {
		const config = JSON.stringify({ pattern: "[invalid", replacement: "x" });
		const filter = createCustomRegexFilter(config);
		assert.equal(filter.apply("unchanged"), "unchanged");
	});

	it("supports regex flags", () => {
		const config = JSON.stringify({ pattern: "^hello", replacement: "HI", flags: "gm" });
		const filter = createCustomRegexFilter(config);
		assert.equal(filter.apply("hello world\nhello again"), "HI world\nHI again");
	});
});
