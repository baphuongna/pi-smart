import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createShortenPathsFilter } from "../../src/filter/filters/shorten-paths.ts";

describe("shorten-paths filter", () => {
	it("shortens project root paths to ./", () => {
		const filter = createShortenPathsFilter("/home/user/project");
		const input = "/home/user/project/src/index.ts";
		assert.equal(filter.apply(input), "./src/index.ts");
	});

	it("leaves short paths unchanged", () => {
		const filter = createShortenPathsFilter();
		assert.equal(filter.apply("src/index.ts"), "src/index.ts");
	});

	it("handles empty string", () => {
		const filter = createShortenPathsFilter();
		assert.equal(filter.apply(""), "");
	});
});
