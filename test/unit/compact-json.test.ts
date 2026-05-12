import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCompactJsonFilter } from "../../src/filter/filters/compact-json.ts";

describe("compact-json filter", () => {
	it("compacts JSON blocks in markdown", () => {
		const filter = createCompactJsonFilter();
		const input = '```json\n{ "a" : 1 , "b" : 2 }\n```';
		const result = filter.apply(input);
		assert.ok(result.includes('"a": 1'));
		assert.ok(result.includes('"b": 2'));
	});

	it("truncates large arrays", () => {
		const filter = createCompactJsonFilter();
		const arr = Array.from({ length: 30 }, (_, i) => i);
		const input = "```json\n" + JSON.stringify(arr) + "\n```";
		const result = filter.apply(input);
		assert.ok(result.includes("items omitted"));
	});

	it("leaves non-JSON blocks unchanged", () => {
		const filter = createCompactJsonFilter();
		assert.equal(filter.apply("plain text"), "plain text");
	});
});
